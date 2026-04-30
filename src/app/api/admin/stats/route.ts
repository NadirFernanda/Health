import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireSession("ADMIN");
  if (auth instanceof Response) return auth;

  const [
    totalMedicos,
    medicosVerificados,
    totalClinicas,
    clinicasVerificadas,
    totalPlantoes,
    plantoesAbertos,
    plantoesConcluidos,
    comissaoAgg,
    receitaAgg,
  ] = await Promise.all([
    prisma.profissional.count(),
    prisma.profissional.count({ where: { verified: true } }),
    prisma.clinica.count(),
    prisma.clinica.count({ where: { verified: true } }),
    prisma.plantao.count(),
    prisma.plantao.count({ where: { estado: "ABERTO" } }),
    prisma.plantao.count({ where: { estado: "CONCLUIDO" } }),
    prisma.pagamento.aggregate({
      _sum: { comissaoAoa: true },
      where: { estado: "CONFIRMADO" },
    }),
    prisma.pagamento.aggregate({
      _sum: { valorBrutoAoa: true },
      where: { estado: "CONFIRMADO" },
    }),
  ]);

  return Response.json({
    totalMedicos,
    medicosVerificados,
    medicosPendentes: totalMedicos - medicosVerificados,
    totalClinicas,
    clinicasVerificadas,
    clinicasPendentes: totalClinicas - clinicasVerificadas,
    totalPlantoes,
    plantoesAbertos,
    plantoesConcluidos,
    comissaoPlataforma: comissaoAgg._sum.comissaoAoa ?? 0,
    receitaPlataforma: receitaAgg._sum.valorBrutoAoa ?? 0,
  });
}
