import { requireAdminAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireAdminAccess("profissionais", "read");
  if (auth instanceof Response) return auth;

  const [profissionais, clinicas, consultorios] = await Promise.all([
    prisma.profissional.findMany({
      orderBy: { user: { lastLoginAt: "desc" } },
      select: {
        id: true,
        nome: true,
        tipo: true,
        especialidade: true,
        provincia: true,
        cidade: true,
        foto: true,
        rating: true,
        totalAvaliacoes: true,
        totalPlantoes: true,
        estadoVerificacao: true,
        saldoCarteira: true,
        disponivelAgora: true,
        user: {
          select: {
            id: true,
            email: true,
            criadoEm: true,
            lastLoginAt: true,
            isActive: true,
          },
        },
        _count: { select: { candidaturas: true } },
      },
    }),

    prisma.clinica.findMany({
      orderBy: { user: { lastLoginAt: "desc" } },
      select: {
        id: true,
        nome: true,
        cidade: true,
        provincia: true,
        logo: true,
        rating: true,
        totalAvaliacoes: true,
        verified: true,
        estadoVerificacao: true,
        user: {
          select: {
            id: true,
            email: true,
            criadoEm: true,
            lastLoginAt: true,
            isActive: true,
          },
        },
        _count: { select: { plantoes: true } },
      },
    }),

    prisma.consultorio.findMany({
      orderBy: { user: { lastLoginAt: "desc" } },
      select: {
        id: true,
        nome: true,
        cidade: true,
        zonaLuanda: true,
        rating: true,
        verified: true,
        user: {
          select: {
            id: true,
            email: true,
            criadoEm: true,
            lastLoginAt: true,
            isActive: true,
          },
        },
        _count: { select: { salas: true } },
      },
    }),
  ]);

  const pessoas = [
    ...profissionais.map((p) => ({
      userId: p.user.id,
      role: "MEDICO" as const,
      nome: p.nome,
      email: p.user.email,
      foto: p.foto ?? null,
      lastLoginAt: p.user.lastLoginAt?.toISOString() ?? null,
      criadoEm: p.user.criadoEm.toISOString(),
      isActive: p.user.isActive,
      // profissional
      profissionalId: p.id,
      tipo: p.tipo,
      especialidade: p.especialidade,
      localizacao: [p.cidade, p.provincia].filter(Boolean).join(", "),
      estadoVerificacao: p.estadoVerificacao,
      totalPlantoes: p.totalPlantoes,
      totalCandidaturas: p._count.candidaturas,
      rating: p.rating,
      totalAvaliacoes: p.totalAvaliacoes,
      saldoCarteira: p.saldoCarteira,
      disponivelAgora: p.disponivelAgora,
    })),

    ...clinicas.map((c) => ({
      userId: c.user.id,
      role: "CLINICA" as const,
      nome: c.nome,
      email: c.user.email,
      foto: c.logo ?? null,
      lastLoginAt: c.user.lastLoginAt?.toISOString() ?? null,
      criadoEm: c.user.criadoEm.toISOString(),
      isActive: c.user.isActive,
      clinicaId: c.id,
      localizacao: [c.cidade, c.provincia].filter(Boolean).join(", "),
      estadoVerificacao: c.estadoVerificacao,
      totalPlantoesPublicados: c._count.plantoes,
      rating: c.rating,
      totalAvaliacoes: c.totalAvaliacoes,
    })),

    ...consultorios.map((o) => ({
      userId: o.user.id,
      role: "PROPRIETARIO_SALA" as const,
      nome: o.nome,
      email: o.user.email,
      foto: null,
      lastLoginAt: o.user.lastLoginAt?.toISOString() ?? null,
      criadoEm: o.user.criadoEm.toISOString(),
      isActive: o.user.isActive,
      consultorioId: o.id,
      localizacao: [o.zonaLuanda, o.cidade].filter(Boolean).join(", "),
      estadoVerificacao: o.verified ? "APROVADO" : "PENDENTE",
      totalSalas: o._count.salas,
      rating: o.rating,
    })),
  ];

  // Sort: most recently active first, never-logged-in last
  pessoas.sort((a, b) => {
    if (!a.lastLoginAt && !b.lastLoginAt) return 0;
    if (!a.lastLoginAt) return 1;
    if (!b.lastLoginAt) return -1;
    return new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime();
  });

  return Response.json(pessoas);
}
