import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const subscribeSchema = z.object({
  endpoint: z.url().max(2048),
  keys: z.object({
    p256dh: z.string().min(10).max(200),
    auth: z.string().min(10).max(100),
  }),
});

const deleteSchema = z.object({
  endpoint: z.url().max(2048),
});

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof Response) return auth;
  const { session } = auth;

  let rawBody: unknown;
  try { rawBody = await request.json(); } catch { return Response.json({ error: "Body inválido" }, { status: 400 }); }
  const parsed = subscribeSchema.safeParse(rawBody);
  if (!parsed.success) return Response.json({ error: "Dados de subscrição inválidos" }, { status: 400 });

  const { endpoint, keys } = parsed.data;
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: session.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { userId: session.id, p256dh: keys.p256dh, auth: keys.auth },
  });

  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof Response) return auth;
  const { session } = auth;

  let rawBody: unknown;
  try { rawBody = await request.json(); } catch { return Response.json({ error: "Body inválido" }, { status: 400 }); }
  const parsed = deleteSchema.safeParse(rawBody);
  if (!parsed.success) return Response.json({ error: "endpoint inválido" }, { status: 400 });

  await prisma.pushSubscription.deleteMany({
    where: { endpoint: parsed.data.endpoint, userId: session.id },
  });

  return Response.json({ ok: true });
}
