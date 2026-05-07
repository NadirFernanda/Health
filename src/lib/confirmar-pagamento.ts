import { prisma } from "@/lib/db";
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

  // Taxa de reserva do médico → candidatura ACEITE
  if (pagamento.candidaturaId && pagamento.candidatura?.estado === "AGUARDANDO_PAGAMENTO") {
    const cand = pagamento.candidatura;
    const plantaoCand = cand.plantao;

    await tx.candidatura.update({
      where: { id: cand.id },
      data: { estado: "ACEITE", respondidoEm: new Date() },
    });

    const updated = await tx.plantao.update({
      where: { id: plantaoCand.id },
      data: { vagasPreenchidas: { increment: 1 } },
      select: { vagasPreenchidas: true, vagas: true },
    });

    if (updated.vagasPreenchidas >= updated.vagas) {
      await tx.plantao.update({ where: { id: plantaoCand.id }, data: { estado: "FECHADO" } });
      await tx.candidatura.updateMany({
        where: { plantaoId: plantaoCand.id, estado: "PENDENTE", id: { not: cand.id } },
        data: { estado: "RECUSADO", respondidoEm: new Date() },
      });
    }

    // Ligar médico como beneficiário do escrow da clínica
    const escrow = await tx.pagamento.findFirst({
      where: { plantaoId: plantaoCand.id, estado: "CONFIRMADO", beneficiarioProfissionalId: null, candidaturaId: null },
    });
    if (escrow) {
      await tx.pagamento.update({
        where: { id: escrow.id },
        data: { beneficiarioProfissionalId: cand.profissional.id, candidaturaId: cand.id },
      });
    }

    await criarNotificacaoComPush(tx, {
      userId: cand.profissional.userId,
      tipo: "PAGAMENTO",
      titulo: "Taxa confirmada — contrato activo!",
      corpo: `A tua taxa de reserva para o plantão de ${plantaoCand.especialidade} foi confirmada. O contrato está activo.`,
      href: `/medico/plantoes/${plantaoCand.id}`,
    });

    if (plantaoCand.clinica?.userId) {
      await criarNotificacaoComPush(tx, {
        userId: plantaoCand.clinica.userId,
        tipo: "CONTRATO",
        titulo: "Médico confirmado!",
        corpo: `${cand.profissional.nome} confirmou a presença no plantão de ${plantaoCand.especialidade}.`,
        href: `/clinica/plantoes/${plantaoCand.id}`,
      });
    }
  }
}
