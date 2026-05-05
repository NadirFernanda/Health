/**
 * Helpers de autenticação para API Routes e Server Components (Node.js runtime).
 * NÃO usar no middleware (Edge Runtime).
 */
import { cookies } from "next/headers";
import { verifySessionToken, getPayloadFromToken, COOKIE_NAME, UserRole } from "./auth";
import { prisma } from "./db";
import { type AdminModule, type AccessLevel, checkModuleAccess } from "./admin-permissions";

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

export async function getConsultorioFromSession(session: SessionPayload) {
  return prisma.consultorio.findUnique({ where: { userId: session.id } });
}

/**
 * Verifica sessão ADMIN + permissão de módulo.
 * null adminRole = master = acesso total.
 * Retorna { session, adminRole } se autorizado, ou Response (401/403) se não.
 */
export async function requireAdminAccess(
  module: AdminModule,
  minAccess: AccessLevel = "read"
): Promise<{ session: SessionPayload; adminRole: string | null } | Response> {
  const auth = await requireSession("ADMIN");
  if (auth instanceof Response) return auth;
  const { session } = auth;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { adminRole: true },
  });
  const adminRole = user?.adminRole ?? null; // null = master

  const allowed = await checkModuleAccess(session.id, adminRole, module, minAccess);
  if (!allowed) {
    return Response.json(
      { error: "Sem permissão para este módulo", module, required: minAccess },
      { status: 403 }
    );
  }
  return { session, adminRole };
}

/** Verifica se o utilizador é master (adminRole null). Retorna 403 caso contrário. */
export async function requireMaster(): Promise<{ session: SessionPayload } | Response> {
  const auth = await requireSession("ADMIN");
  if (auth instanceof Response) return auth;
  const { session } = auth;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { adminRole: true },
  });
  if (user?.adminRole !== null && user?.adminRole !== undefined) {
    return Response.json({ error: "Acesso restrito ao master admin" }, { status: 403 });
  }
  return { session };
}
