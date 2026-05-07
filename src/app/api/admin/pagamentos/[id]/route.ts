import { NextRequest } from "next/server";
import { requireAdminAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { criarNotificacaoComPush } from "@/lib/push";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess("financeiro", "write");
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const { acao } = await request.json() as { acao: string };

  if (acao !== "CONFIRMAR" && acao !== "REJEITAR") {
    return Response.json({ error: "acao deve ser CONFIRMAR ou REJEITAR" }, { status: 400 });
  }

  const pagamento = await prisma.pagamento.findUnique({
    where: { id },
    include: {
      plantao: {
        select: {
          id: true, estado: true, clinicaId: true, profissionalPublicadorId: true, especialidade: true,
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

  if (!pagamento) return Response.json({ error: "Pagamento não encontrado" }, { status: 404 });
  if (pagamento.estado !== "PENDENTE") {
    return Response.json({ error: "Pagamento já processado" }, { status: 409 });
  }

  if (acao === "CONFIRMAR") {
    await prisma.$transaction(async (tx) => {
      await tx.pagamento.update({
        where: { id },
        data: { estado: "CONFIRMADO", pagoEm: new Date() },
      });

      // Confirmar publicação de plantão (clinica ou médico a publicar)
      if (pagamento.plantao?.estado === "AGUARDANDO_PAGAMENTO" && !pagamento.candidaturaId) {
        await tx.plantao.update({
          where: { id: pagamento.plantao.id },
          data: { estado: "ABERTO" },
        });
      }

      // Confirmar reserva de sala
      if (pagamento.reservaSala?.estado === "PENDENTE_PAGAMENTO") {
        await tx.reservaSala.update({
          where: { id: pagamento.reservaSala.id },
          data: { estado: "CONFIRMADA" },
        });
      }

      // Confirmar taxa de reserva do médico → candidatura ACEITE
      if (pagamento.candidaturaId && pagamento.candidatura?.estado === "AGUARDANDO_PAGAMENTO") {
        const cand = pagamento.candidatura;
        const plantaoCand = cand.plantao;

        // Activar candidatura
        await tx.candidatura.update({
          where: { id: cand.id },
          data: { estado: "ACEITE", respondidoEm: new Date() },
        });

        // Incrementar vagas preenchidas
        const updated = await tx.plantao.update({
          where: { id: plantaoCand.id },
          data: { vagasPreenchidas: { increment: 1 } },
          select: { vagasPreenchidas: true, vagas: true },
        });

        if (updated.vagasPreenchidas >= updated.vagas) {
          await tx.plantao.update({
            where: { id: plantaoCand.id },
            data: { estado: "FECHADO" },
          });
          await tx.candidatura.updateMany({
            where: { plantaoId: plantaoCand.id, estado: "PENDENTE", id: { not: cand.id } },
            data: { estado: "RECUSADO", respondidoEm: new Date() },
          });
        }

        // Ligar o médico como beneficiário do pagamento em escrow da clínica
        const escrow = await tx.pagamento.findFirst({
          where: { plantaoId: plantaoCand.id, estado: "CONFIRMADO", beneficiarioProfissionalId: null, candidaturaId: null },
        });
        if (escrow) {
          await tx.pagamento.update({
            where: { id: escrow.id },
            data: { beneficiarioProfissionalId: cand.profissional.id, candidaturaId: cand.id },
          });
        }

        // Notificar médico
        await criarNotificacaoComPush(tx, {
          userId: cand.profissional.userId,
          tipo: "PAGAMENTO",
          titulo: "Pagamento confirmado — contrato activo!",
          corpo: `A tua taxa de reserva para o plantão de ${plantaoCand.especialidade} foi confirmada. O contrato está activo.`,
          href: `/medico/plantoes/${plantaoCand.id}`,
        });

        // Notificar clínica
        if (plantaoCand.clinica?.userId) {
          await criarNotificacaoComPush(tx, {
            userId: plantaoCand.clinica.userId,
            tipo: "CONTRATO",
            titulo: "Médico confirmado!",
            corpo: `${cand.profissional.nome} confirmou a presença no plantão de ${plantaoCand.especialidade}.`,
            href: `/clinica/plantoes/${plantaoCand.id}`,
          });
        }
        return;
      }

      // Notificar o pagador (publicação de plantão ou reserva de sala)
      const payerUserId =
        pagamento.plantao?.clinica?.userId ??
        pagamento.plantao?.profissionalPublicador?.userId ??
        pagamento.reservaSala?.profissional?.userId;

      if (payerUserId) {
        const isClinica = !!pagamento.plantao?.clinica?.userId;
        const descricao = pagamento.plantao
          ? `O teu plantão de ${pagamento.plantao.especialidade} foi publicado. Pagamento de ${pagamento.valorBrutoAoa.toLocaleString()} AOA confirmado.`
          : `A tua reserva de sala foi confirmada. Pagamento de ${pagamento.valorBrutoAoa.toLocaleString()} AOA confirmado.`;
        const href = pagamento.plantao
          ? (isClinica ? "/clinica/plantoes" : "/medico/plantoes")
          : "/medico/minhas-reservas";

        await criarNotificacaoComPush(tx, {
          userId: payerUserId,
          tipo: "PAGAMENTO",
          titulo: "Pagamento confirmado!",
          corpo: descricao,
          href,
        });
      }
    });

    return Response.json({ ok: true, estado: "CONFIRMADO" });
  }

  // REJEITAR
  await prisma.$transaction(async (tx) => {
    await tx.pagamento.update({
      where: { id },
      data: { estado: "FALHOU", falhaMotivo: "Pagamento não confirmado pelo administrador" },
    });

    if (pagamento.candidaturaId && pagamento.candidatura?.estado === "AGUARDANDO_PAGAMENTO") {
      await tx.candidatura.update({
        where: { id: pagamento.candidatura.id },
        data: { estado: "CANCELADA" },
      });
      await criarNotificacaoComPush(tx, {
        userId: pagamento.candidatura.profissional.userId,
        tipo: "PAGAMENTO",
        titulo: "Pagamento não confirmado",
        corpo: "Não foi possível confirmar a tua taxa de reserva. O contrato foi cancelado. Contacta o suporte.",
        href: "/support",
      });
      return;
    }

    if (pagamento.plantao && !pagamento.candidaturaId) {
      await tx.plantao.update({
        where: { id: pagamento.plantao.id },
        data: { estado: "CANCELADO" },
      });
    }

    if (pagamento.reservaSala) {
      await tx.reservaSala.update({
        where: { id: pagamento.reservaSala.id },
        data: { estado: "CANCELADA" },
      });
    }

    const payerUserId =
      pagamento.plantao?.clinica?.userId ??
      pagamento.plantao?.profissionalPublicador?.userId ??
      pagamento.reservaSala?.profissional?.userId;

    if (payerUserId) {
      await criarNotificacaoComPush(tx, {
        userId: payerUserId,
        tipo: "PAGAMENTO",
        titulo: "Pagamento não confirmado",
        corpo: "Não conseguimos confirmar o teu pagamento. A publicação foi cancelada. Contacta o suporte.",
        href: "/support",
      });
    }
  });

  return Response.json({ ok: true, estado: "FALHOU" });
}
