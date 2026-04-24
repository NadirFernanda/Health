/**
 * Helpers de autenticação para API Routes e Server Components (Node.js runtime).
 * NÃO usar no middleware (Edge Runtime).
 */
import { cookies } from "next/headers";
import { verifySessionToken, getPayloadFromToken, COOKIE_NAME, UserRole } from "./auth";
import { prisma } from "./db";

export type SessionPayload = { id: string; sub: string; role: UserRole };

export async function getAuthSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  if (!(await verifySessionToken(token))) return null;
  return getPayloadFromToken(token);
}

export async function requireSession(
  role?: UserRole
): Promise<{ session: SessionPayload } | Response> {
  const session = await getAuthSession();
  if (!session)
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  if (role && session.role !== role)
    return Response.json({ error: "Sem permissão" }, { status: 403 });
  return { session };
}

export async function getProfissionalFromSession(session: SessionPayload) {
  return prisma.profissional.findUnique({ where: { userId: session.id } });
}

export async function getClinicaFromSession(session: SessionPayload) {
  return prisma.clinica.findUnique({ where: { userId: session.id } });
}
