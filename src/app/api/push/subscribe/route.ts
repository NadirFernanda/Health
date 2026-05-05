import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof Response) return auth;
  const { session } = auth;

  const body = await request.json();
  const { endpoint, keys } = body as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: "Dados de subscrição inválidos" }, { status: 400 });
  }

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

  const body = await request.json();
  const { endpoint } = body as { endpoint: string };

  if (!endpoint) {
    return Response.json({ error: "endpoint obrigatório" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.id },
  });

  return Response.json({ ok: true });
}
