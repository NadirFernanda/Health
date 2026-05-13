import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { createSessionToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";
import { cookies } from "next/headers";
import { z } from "zod";

const ADMIN_TOKEN_COOKIE = "medfreela_admin_token";

const bodySchema = z.object({
  role: z.enum(["MEDICO", "CLINICA", "PROPRIETARIO_SALA"]),
  profileId: z.string().min(1),
});

const DASHBOARDS: Record<string, string> = {
  MEDICO: "/medico",
  CLINICA: "/clinica",
  PROPRIETARIO_SALA: "/consultorio",
};

export async function POST(req: NextRequest) {
  const auth = await requireAdminAccess("profissionais", "read");
  if (auth instanceof Response) return auth;
  const { session: adminSession } = auth;

  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Body inválido" }, { status: 400 }); }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { role, profileId } = parsed.data;

  // Resolve userId from profile id
  let targetUserId: string | null = null;
  if (role === "MEDICO") {
    const p = await prisma.profissional.findUnique({ where: { id: profileId }, select: { userId: true } });
    targetUserId = p?.userId ?? null;
  } else if (role === "CLINICA") {
    const c = await prisma.clinica.findUnique({ where: { id: profileId }, select: { userId: true } });
    targetUserId = c?.userId ?? null;
  } else {
    const c = await prisma.consultorio.findUnique({ where: { id: profileId }, select: { userId: true } });
    targetUserId = c?.userId ?? null;
  }

  if (!targetUserId) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, role: true },
  });
  if (!targetUser) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

  // Audit trail
  await prisma.auditLog.create({
    data: {
      entity: "User",
      entityId: targetUserId,
      action: "ADMIN_IMPERSONATE_START",
      detalhes: { adminId: adminSession.id, adminEmail: adminSession.sub, targetEmail: targetUser.email, role },
      usuarioId: adminSession.id,
    },
  });

  // Build target session token and swap cookies
  const targetToken = await createSessionToken(targetUser.id, targetUser.email, targetUser.role);

  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value ?? "";

  const isSecure = process.env.NODE_ENV === "production";
  const cookieOpts = { httpOnly: true, secure: isSecure, sameSite: "lax" as const, path: "/" };

  cookieStore.set(ADMIN_TOKEN_COOKIE, adminToken, { ...cookieOpts, maxAge: COOKIE_MAX_AGE });
  cookieStore.set(COOKIE_NAME, targetToken, { ...cookieOpts, maxAge: COOKIE_MAX_AGE });

  return NextResponse.json({ redirectTo: DASHBOARDS[role] ?? "/" });
}
