import { prisma } from "./db";

export type AdminModule =
  | "dashboard"
  | "profissionais"
  | "financeiro"
  | "plantoes"
  | "disputas"
  | "suporte"
  | "configuracoes"
  | "admins";

export type AccessLevel = "none" | "read" | "write" | "full";

const ACCESS_ORDER: Record<AccessLevel, number> = {
  none: 0, read: 1, write: 2, full: 3,
};

export function hasAccess(actual: AccessLevel, required: AccessLevel): boolean {
  return ACCESS_ORDER[actual] >= ACCESS_ORDER[required];
}

// Static permission matrix — null adminRole = master (full access to everything)
const STATIC: Record<string, Record<AdminModule, AccessLevel>> = {
  FINANCEIRO: {
    dashboard:      "read",
    profissionais:  "none",
    financeiro:     "full",
    plantoes:       "read",
    disputas:       "none",
    suporte:        "none",
    configuracoes:  "none",
    admins:         "none",
  },
  GESTOR: {
    dashboard:      "read",
    profissionais:  "write",
    financeiro:     "none",
    plantoes:       "write",
    disputas:       "full",
    suporte:        "full",
    configuracoes:  "none",
    admins:         "none",
  },
  SUPORTE: {
    dashboard:      "read",
    profissionais:  "read",
    financeiro:     "none",
    plantoes:       "none",
    disputas:       "write",
    suporte:        "full",
    configuracoes:  "none",
    admins:         "none",
  },
  ANALISTA: {
    dashboard:      "full",
    profissionais:  "read",
    financeiro:     "read",
    plantoes:       "read",
    disputas:       "none",
    suporte:        "none",
    configuracoes:  "none",
    admins:         "none",
  },
};

const ALL_MODULES: AdminModule[] = [
  "dashboard", "profissionais", "financeiro", "plantoes",
  "disputas", "suporte", "configuracoes", "admins",
];

function getStaticAccess(adminRole: string | null, module: AdminModule): AccessLevel {
  if (adminRole === null) return "full"; // master
  return STATIC[adminRole]?.[module] ?? "none";
}

/**
 * Verifica se um utilizador admin tem acesso a um módulo com nível mínimo exigido.
 * null adminRole = master = acesso total a tudo.
 */
export async function checkModuleAccess(
  userId: string,
  adminRole: string | null,
  module: AdminModule,
  required: AccessLevel = "read"
): Promise<boolean> {
  if (adminRole === null) return true; // master

  const staticAccess = getStaticAccess(adminRole, module);
  // If static map gives something other than 'none', use it (no DB fallback needed)
  if (staticAccess !== "none") return hasAccess(staticAccess, required);

  // Static says 'none' — check if there's an explicit DB override
  const perm = await prisma.adminPermission.findUnique({
    where: { userId_module: { userId, module } },
    select: { access: true },
  });
  if (!perm) return false;
  const level = perm.access.toLowerCase() as AccessLevel;
  return hasAccess(level, required);
}

/**
 * Retorna os módulos acessíveis e os respectivos níveis de acesso para um admin.
 * Usado pelo layout para filtrar a nav.
 */
export async function getAccessibleModules(
  userId: string,
  adminRole: string | null
): Promise<Partial<Record<AdminModule, AccessLevel>>> {
  if (adminRole === null) {
    return Object.fromEntries(ALL_MODULES.map((m) => [m, "full"])) as Record<AdminModule, AccessLevel>;
  }

  const staticPerms = { ...STATIC[adminRole] } as Partial<Record<AdminModule, AccessLevel>>;

  // DB overrides (admin_permissions table allows custom grants beyond static map)
  const dbPerms = await prisma.adminPermission.findMany({
    where: { userId },
    select: { module: true, access: true },
  });
  for (const p of dbPerms) {
    staticPerms[p.module as AdminModule] = p.access.toLowerCase() as AccessLevel;
  }

  return staticPerms;
}
