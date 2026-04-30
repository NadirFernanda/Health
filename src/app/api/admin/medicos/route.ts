import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireSession("ADMIN");
  if (auth instanceof Response) return auth;

  const medicos = await prisma.profissional.findMany({
    orderBy: { user: { criadoEm: "desc" } },
    include: {
      user: { select: { email: true, criadoEm: true, isActive: true } },
      credenciais: { select: { estado: true, express: true } },
    },
  });

  return Response.json(
    medicos.map((m) => {
      const temCredencialExpress = m.credenciais.some((c) => c.express);
      const credencialPendente = m.credenciais.some(
        (c) => c.estado === "PENDENTE" || c.estado === "EXPRESS_PENDENTE"
      );
      const estadoVerificacao = m.verified
        ? "APROVADO"
        : !m.user.isActive
        ? "SUSPENSO"
        : credencialPendente
        ? "PENDENTE"
        : "PENDENTE";

      return {
        id: m.id,
        userId: m.userId,
        nome: m.nome,
        email: m.user.email,
        especialidade: m.especialidade,
        provincia: m.provincia,
        numeroOrdem: m.numeroOrdem ?? "",
        rating: m.rating,
        totalAvaliacoes: m.totalAvaliacoes,
        totalPlantoes: m.totalPlantoes,
        verified: m.verified,
        isActive: m.user.isActive,
        estadoVerificacao: m.verified
          ? !m.user.isActive
            ? "SUSPENSO"
            : "APROVADO"
          : "PENDENTE",
        tipoVerificacao: temCredencialExpress ? "EXPRESS" : "NORMAL",
        criadoEm: m.user.criadoEm.toISOString(),
      };
    })
  );
}
