import { prisma } from "@/lib/db";
import { criarNotificacaoComPush } from "@/lib/push";
import { createAuditLog } from "@/lib/audit-logger";
import type { Prisma } from "@/generated/prisma/client";

const MAX_PAYMENT_RETRIES = 3;
const RETRY_DELAY_MS = 1000 * 60 * 60; // 1 hora

export async function createEscrowPayment(
  data: {
    tipo: string;
    plantaoId?: string;
    candidaturaId?: string;
    reservaSalaId?: string;
    beneficiarioProfissionalId: string;
    valorBrutoAoa: number;
    comissaoAoa: number;
    valorLiquidoAoa: number;
    metodo: string;
    referenciaExt?: string;
  },
  tx: Prisma.TransactionClient | typeof prisma = prisma
) {
  return tx.pagamento.create({
    data: {
      tipo: data.tipo as any,
      plantaoId: data.plantaoId,
      candidaturaId: data.candidaturaId,
      reservaSalaId: data.reservaSalaId,
      beneficiarioProfissionalId: data.beneficiarioProfissionalId,
      valorBrutoAoa: data.valorBrutoAoa,
      comissaoAoa: data.comissaoAoa,
      valorLiquidoAoa: data.valorLiquidoAoa,
      metodo: data.metodo as any,
      estado: "PENDENTE",
      retryAttempts: 0,
      falhaMotivo: null,
      nextRetryAt: null,
      referenciaExt: data.referenciaExt,
    },
  });
}

export async function recalculateRevenueForProfessional(
  profissionalId: string,
  tx = prisma
): Promise<number> {
  const aggregate = await tx.transacaoCarteira.aggregate({
    _sum: { valorCentavos: true },
    where: {
      profissionalId,
      tipo: "CREDITO",
      estado: "PROCESSADO",
    },
  });

  const totalCentavos = aggregate._sum.valorCentavos ?? 0n;
  const receitaTotal = Number(totalCentavos / 100n);

  const profissional = await tx.profissional.findUnique({
    where: { id: profissionalId },
    select: { metrics: true },
  });

  const metrics =
    typeof profissional?.metrics === "object" && profissional.metrics !== null
      ? { ...profissional.metrics, receita_total: receitaTotal }
      : { receita_total: receitaTotal };

  await tx.profissional.update({
    where: { id: profissionalId },
    data: { metrics },
  });

  await createAuditLog("revenue_recalculated", {
    entity: "Profissional",
    entityId: profissionalId,
    receitaTotal,
  });

  return receitaTotal;
}

function getEmailTemplate(type: string, payload: Record<string, unknown>) {
  switch (type) {
    case "PAYMENT_FAILED":
      return {
        subject: "Falha no processamento do pagamento",
        body: `Detectámos uma falha no pagamento. Motivo: ${payload.reason ?? "não especificado"}. Por favor tente novamente ou escolha outro método.`,
      };
    case "PAYMENT_RETRY_SUCCESS":
      return {
        subject: "Pagamento reprocessado com sucesso",
        body: `O pagamento foi reprocessado com sucesso e o serviço continua confirmado.`,
      };
    case "PAYMENT_RETRY_FAILED":
      return {
        subject: "Falha final na retentativa do pagamento",
        body: `O pagamento falhou definitivamente após várias tentativas. Um administrador já foi notificado para revisão manual.`,
      };
    case "REVENUE_ADJUSTED":
      return {
        subject: "Ajuste manual de receita aplicado",
        body: `A sua receita foi ajustada em ${payload.adjustment ?? 0} AOA. Verifique o histórico financeiro para detalhes.`,
      };
    default:
      return { subject: "Notificação Medfreela", body: "Temos uma atualização sobre a sua conta." };
  }
}

export async function sendTransactionalEmail(
  userId: string,
  type: string,
  payload: Record<string, unknown>
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const template = getEmailTemplate(type, payload);
  console.info(`[EMAIL] Para: ${user.email} | Assunto: ${template.subject} | Corpo: ${template.body}`);
}

export async function processPaymentEscrow(
  paymentId: string,
  options?: { forceFailure?: boolean; tx?: Prisma.TransactionClient | typeof prisma }
): Promise<boolean> {
  const tx = options?.tx ?? prisma;
  const payment = await tx.pagamento.findUnique({ where: { id: paymentId } });
  if (!payment) return false;
  if (payment.estado === "CONFIRMADO") return true;

  const shouldFail = options?.forceFailure ?? process.env.PAYMENT_GATEWAY_SIMULATE_FAILURE === "true";
  const success = !shouldFail;

  if (success) {
    await tx.pagamento.update({
      where: { id: paymentId },
      data: {
        estado: "CONFIRMADO",
        pagoEm: new Date(),
        falhaMotivo: null,
        nextRetryAt: null,
      },
    });

    await createAuditLog("payment_confirmed", {
      entity: "Pagamento",
      entityId: paymentId,
      valorBrutoAoa: payment.valorBrutoAoa,
      metodo: payment.metodo,
    });

    if (payment.beneficiarioProfissionalId) {
      const prof = await tx.profissional.findUnique({
        where: { id: payment.beneficiarioProfissionalId },
        select: { userId: true },
      });
      if (prof?.userId) {
        await criarNotificacaoComPush(tx, {
          userId: prof.userId,
          tipo: "PAGAMENTO_PROCESSADO",
          titulo: "Pagamento processado com sucesso",
          corpo: `O pagamento de ${payment.valorLiquidoAoa.toLocaleString()} AOA foi processado e encontra-se reservado para liberação após conclusão do serviço.`,
          href: "/medico/ganhos",
        });
      }
    }

    return true;
  }

  await handlePaymentFailure(payment, "Cartão recusado ou erro de gateway", tx);
  return false;
}

export async function handlePaymentFailure(
  payment: { id: string; beneficiarioProfissionalId: string | null; retryAttempts: number | null; valorBrutoAoa: number },
  reason: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma
) {
  const attempts = (payment.retryAttempts ?? 0) + 1;
  const nextRetryAt = new Date(Date.now() + RETRY_DELAY_MS);

  await tx.pagamento.update({
    where: { id: payment.id },
    data: {
      estado: "FALHOU",
      falhaMotivo: reason,
      retryAttempts: attempts,
      nextRetryAt,
    },
  });

  await createAuditLog("payment_failed", {
    entity: "Pagamento",
    entityId: payment.id,
    reason,
    attempts,
    nextRetryAt: nextRetryAt.toISOString(),
  });

  if (payment.beneficiarioProfissionalId) {
    const prof = await tx.profissional.findUnique({
      where: { id: payment.beneficiarioProfissionalId },
      select: { userId: true },
    });
    if (prof?.userId) {
      await criarNotificacaoComPush(tx, {
        userId: prof.userId,
        tipo: "PAYMENT_FAILED_NOTIFICATION",
        titulo: "Falha no pagamento",
        corpo: `Houve uma falha no processamento do pagamento de ${payment.valorBrutoAoa.toLocaleString()} AOA. Tentaremos novamente em 1 hora.`,
        href: "/medico/ganhos",
      });
      await sendTransactionalEmail(prof.userId, "PAYMENT_FAILED", { reason });
    }
  }

  if (attempts >= MAX_PAYMENT_RETRIES) {
    const admins = await tx.user.findMany({ where: { role: "ADMIN" } });
    await Promise.all(
      admins.map((admin) =>
        criarNotificacaoComPush(tx, {
          userId: admin.id,
          tipo: "PAYMENT_RETRY_FAILED_NOTIFICATION",
          titulo: "Falha crítica no pagamento",
          corpo: `O pagamento ${payment.id} falhou ${attempts} vezes e requer intervenção manual.`,
          href: "/admin/transacoes",
        })
      )
    );
    await createAuditLog("payment_retry_escalated", {
      entity: "Pagamento",
      entityId: payment.id,
      attempts,
    });
  }
}

export async function retryPaymentById(
  paymentId: string,
  options?: { forceFailure?: boolean; tx?: Prisma.TransactionClient | typeof prisma }
): Promise<boolean | null> {
  const tx = options?.tx ?? prisma;
  const payment = await tx.pagamento.findUnique({ where: { id: paymentId } });
  if (!payment) return null;
  if (payment.estado !== "FALHOU") return null;

  const result = await processPaymentEscrow(paymentId, options);
  if (!result) return null;
  return true;
}

export async function processDuePaymentRetries(tx: Prisma.TransactionClient | typeof prisma = prisma) {
  const now = new Date();
  const duePayments = await tx.pagamento.findMany({
    where: {
      estado: "FALHOU",
      retryAttempts: { lt: MAX_PAYMENT_RETRIES },
      nextRetryAt: { lte: now },
    },
  });

  for (const payment of duePayments) {
    await processPaymentEscrow(payment.id, { tx });
  }
}

export async function adjustWalletOrRevenue(
  profissionalId: string,
  tipo: "CARTEIRA" | "RECEITA",
  valorKz: number,
  descricao: string,
  motivo: string,
  adminUserId: string,
  tx = prisma
) {
  const profissional = await tx.profissional.findUnique({
    where: { id: profissionalId },
    select: { userId: true, metrics: true },
  });
  if (!profissional) throw new Error("Profissional não encontrado");

  const transacao = await tx.transacaoCarteira.create({
    data: {
      profissionalId,
      tipo: valorKz >= 0 ? "CREDITO" : "DEBITO",
      descricao,
      estado: "PROCESSADO",
      valorCentavos: BigInt(Math.abs(valorKz)) * 100n,
      referencia: `ajuste_${Date.now()}`,
    },
  });

  if (tipo === "CARTEIRA") {
    await tx.profissional.update({
      where: { id: profissionalId },
      data: { saldoCarteira: { increment: valorKz } },
    });
  }

  const currentMetrics = (profissional.metrics as Record<string, unknown> | null) ?? {};
  const previousReceita = typeof currentMetrics.receita_total === "number" ? currentMetrics.receita_total : 0;
  const nextReceita = previousReceita + valorKz;

  if (tipo === "RECEITA") {
    await tx.profissional.update({
      where: { id: profissionalId },
      data: { metrics: { ...currentMetrics, receita_total: nextReceita } },
    });
  }

  await criarNotificacaoComPush(tx, {
    userId: profissional.userId,
    tipo: "REVENUE_ADJUSTED_NOTIFICATION",
    titulo: "Ajuste financeiro aplicado",
    corpo: `Um ajuste de ${valorKz.toLocaleString()} AOA foi aplicado à sua ${tipo === "CARTEIRA" ? "carteira" : "receita"}. Motivo: ${motivo}`,
    href: "/medico/ganhos",
  });

  await sendTransactionalEmail(profissional.userId, "REVENUE_ADJUSTED", { adjustment: valorKz, motivo });

  await createAuditLog("wallet_or_revenue_adjustment", {
    entity: "Profissional",
    entityId: profissionalId,
    tipo,
    valorKz,
    motivo,
    transacaoId: transacao.id,
  }, adminUserId);

  return { transacaoId: transacao.id, receita: nextReceita };
}
