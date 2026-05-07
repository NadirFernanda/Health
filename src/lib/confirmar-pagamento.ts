import { criarNotificacaoComPush } from "@/lib/push";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Executes all state transitions and notifications for a confirmed payment.
 * Must be called inside a Prisma transaction.
 */
export async function executarConfirmacao(
  pagamentoId: string,
  tx: Prisma.TransactionClient
): Promise<void> {
  const pagamento = await tx.pagamento.findUnique({
    where: { id: pagamentoId },
    include: {
      plantao: {
        select: {
          id: true, estado: true, especialidade: true, clinicaId: true, profissionalPublicadorId: true,
          vagas: true, vagasPreenchidas: true,
          clinica: { select: { userId: true } },
          profissionalPublicador: { select: { userId: true } },
        },
      },
      candidatura: {
        select: {
          id: true, estado: true, plantaoId: true,
          profissional: { select: { id: true, userId: true, nome: true } },
          plantao: {
            select: {
              id: true, vagas: true, vagasPreenchidas: true, especialidade: true, clinicaId: true,
              clinica: { select: { userId: true } },
            },
          },
        },
      },
      reservaSala: {
        select: {
          id: true, estado: true,
          profissional: { select: { userId: true } },
        },
      },
    },
  });

  if (!pagamento) throw new Error("Pagamento não encontrado");

  await tx.pagamento.update({
    where: { id: pagamentoId },
    data: { estado: "CONFIRMADO", pagoEm: new Date() },
  });

  // Publicação de plantão (sem candidatura associada)
  if (pagamento.plantao?.estado === "AGUARDANDO_PAGAMENTO" && !pagamento.candidaturaId) {
    await tx.plantao.update({
      where: { id: pagamento.plantao.id },
      data: { estado: "ABERTO" },
    });

    const payerUserId =
      pagamento.plantao.clinica?.userId ??
      pagamento.plantao.profissionalPublicador?.userId;

    if (payerUserId) {
      const isClinica = !!pagamento.plantao.clinica?.userId;
      await criarNotificacaoComPush(tx, {
        userId: payerUserId,
        tipo: "PAGAMENTO",
        titulo: "Pagamento confirmado — plantão publicado!",
        corpo: `O teu plantão de ${pagamento.plantao.especialidade} está agora visível. Pagamento de ${pagamento.valorBrutoAoa.toLocaleString()} AOA confirmado.`,
        href: isClinica ? "/clinica/plantoes" : "/medico/plantoes",
      });
    }
    return;
  }

  // Reserva de sala
  if (pagamento.reservaSala?.estado === "PENDENTE_PAGAMENTO") {
    await tx.reservaSala.update({
      where: { id: pagamento.reservaSala.id },
      data: { estado: "CONFIRMADA" },
    });

    if (pagamento.reservaSala.profissional?.userId) {
      await criarNotificacaoComPush(tx, {
        userId: pagamento.reservaSala.profissional.userId,
        tipo: "PAGAMENTO",
        titulo: "Reserva confirmada!",
        corpo: `A tua reserva de sala foi confirmada. Pagamento de ${pagamento.valorBrutoAoa.toLocaleString()} AOA processado.`,
        href: "/medico/minhas-reservas",
      });
    }
    return;
  }

}
