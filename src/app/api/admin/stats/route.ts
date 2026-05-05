import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { processDuePaymentRetries } from "@/lib/payment-service";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export async function GET() {
  try {
    const auth = await requireSession("ADMIN");
    if (auth instanceof Response) {
      console.warn("[GET /api/admin/stats] Falha de autenticação");
      return auth;
    }

    console.log("[GET /api/admin/stats] Autenticado como ADMIN");

    await processDuePaymentRetries();
  } catch (error) {
    console.error("Falha ao processar retries de pagamento durante stats:", error);
  }

  const now = new Date();
  const currentStart = startOfMonth(now);
  const previousStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const currentEnd = now;

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
    currentRevenueAgg,
    previousRevenueAgg,
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
    prisma.transacaoCarteira.aggregate({
      _sum: { valorCentavos: true },
      where: {
        tipo: "CREDITO",
        estado: "PROCESSADO",
        criadoEm: { gte: currentStart, lte: currentEnd },
      },
    }),
    prisma.transacaoCarteira.aggregate({
      _sum: { valorCentavos: true },
      where: {
        tipo: "CREDITO",
        estado: "PROCESSADO",
        criadoEm: { gte: previousStart, lt: currentStart },
      },
    }),
  ]);

  const currentRevenue = Number(currentRevenueAgg._sum.valorCentavos ?? 0n) / 100;
  const previousRevenue = Number(previousRevenueAgg._sum.valorCentavos ?? 0n) / 100;
  let financialAlert = null;

  if (currentRevenue < 10000) {
    financialAlert = {
      level: "warning",
      message: "Receita mensal abaixo de 10 000 AOA — atenção necessária.",
      currentRevenue,
      previousRevenue,
    };
  } else if (previousRevenue > 0 && currentRevenue < previousRevenue * 0.5) {
    financialAlert = {
      level: "danger",
      message: "Receita caiu mais de 50% em relação ao mês anterior.",
      currentRevenue,
      previousRevenue,
    };
  } else if (previousRevenue > 0 && currentRevenue > previousRevenue * 2) {
    financialAlert = {
      level: "success",
      message: "Receita subiu mais de 100% em relação ao mês anterior.",
      currentRevenue,
      previousRevenue,
    };
  }

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
    financialAlert,
  });
}
