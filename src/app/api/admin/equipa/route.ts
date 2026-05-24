import { requireAdminAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireAdminAccess("admins", "read");
  if (auth instanceof Response) return auth;

  const agora = new Date();
  const ha30dias = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ha7dias = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [admins, auditLogs] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        adminRole: true,
        adminEmail: true,
        adminCargo: true,
        adminPhone: true,
        criadoEm: true,
        isActive: true,
        lastLoginAt: true,
      },
      orderBy: [{ lastLoginAt: "desc" }, { criadoEm: "asc" }],
    }),

    prisma.auditLog.findMany({
      where: {
        usuarioId: { not: null },
        criadoEm: { gte: ha30dias },
        action: {
          in: [
            "admin_verificacao_profissional",
            "admin_verificacao_clinica",
            "admin_disputa_atualizada",
            "admin_ticket_atualizado",
            "admin_saque",
          ],
        },
      },
      select: {
        usuarioId: true,
        action: true,
        detalhes: true,
        criadoEm: true,
      },
      orderBy: { criadoEm: "desc" },
    }),
  ]);

  // Aggregate per admin
  const statsMap = new Map<string, {
    verificacoesAprovadas: number;
    verificacoesRejeitadas: number;
    disputasResolvidas: number;
    ticketsFechados: number;
    saquesAprovados: number;
    saquesRejeitados: number;
    totalAcoes: number;
    totalAcoes7d: number;
    ultimaAcaoEm: string | null;
    acoes: { action: string; detalhes: unknown; criadoEm: string }[];
  }>();

  for (const log of auditLogs) {
    if (!log.usuarioId) continue;
    if (!statsMap.has(log.usuarioId)) {
      statsMap.set(log.usuarioId, {
        verificacoesAprovadas: 0,
        verificacoesRejeitadas: 0,
        disputasResolvidas: 0,
        ticketsFechados: 0,
        saquesAprovados: 0,
        saquesRejeitados: 0,
        totalAcoes: 0,
        totalAcoes7d: 0,
        ultimaAcaoEm: null,
        acoes: [],
      });
    }
    const s = statsMap.get(log.usuarioId)!;
    const d = log.detalhes as Record<string, unknown>;
    const is7d = log.criadoEm >= ha7dias;

    s.totalAcoes++;
    if (is7d) s.totalAcoes7d++;
    if (!s.ultimaAcaoEm || log.criadoEm.toISOString() > s.ultimaAcaoEm) {
      s.ultimaAcaoEm = log.criadoEm.toISOString();
    }

    if (s.acoes.length < 10) {
      s.acoes.push({ action: log.action, detalhes: log.detalhes, criadoEm: log.criadoEm.toISOString() });
    }

    if (log.action === "admin_verificacao_profissional" || log.action === "admin_verificacao_clinica") {
      if (d.acao === "APROVAR") s.verificacoesAprovadas++;
      else if (d.acao === "REJEITAR") s.verificacoesRejeitadas++;
    } else if (log.action === "admin_disputa_atualizada") {
      if (d.estado === "RESOLVIDA" || d.estado === "ENCERRADA") s.disputasResolvidas++;
    } else if (log.action === "admin_ticket_atualizado") {
      if (d.estadoNovo === "FECHADO") s.ticketsFechados++;
    } else if (log.action === "admin_saque") {
      if (d.acao === "APROVAR") s.saquesAprovados++;
      else if (d.acao === "REJEITAR") s.saquesRejeitados++;
    }
  }

  const result = admins.map((a) => {
    const stats = statsMap.get(a.id) ?? {
      verificacoesAprovadas: 0,
      verificacoesRejeitadas: 0,
      disputasResolvidas: 0,
      ticketsFechados: 0,
      saquesAprovados: 0,
      saquesRejeitados: 0,
      totalAcoes: 0,
      totalAcoes7d: 0,
      ultimaAcaoEm: null,
      acoes: [],
    };

    return {
      id: a.id,
      email: a.adminEmail ?? a.email,
      adminRole: a.adminRole,
      adminCargo: a.adminCargo,
      adminPhone: a.adminPhone,
      criadoEm: a.criadoEm.toISOString(),
      isActive: a.isActive,
      lastLoginAt: a.lastLoginAt?.toISOString() ?? null,
      ...stats,
    };
  });

  return Response.json(result);
}
