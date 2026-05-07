import { NextRequest } from "next/server";
import { requireAdminAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { executarConfirmacao } from "@/lib/confirmar-pagamento";
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
          id: true, estado: true, especialidade: true, clinicaId: true, profissionalPublicadorId: true,
          clinica: { select: { userId: true } },
          profissionalPublicador: { select: { userId: true } },
        },
      },
      candidatura: {
        select: {
          id: true, estado: true,
          profissional: { select: { userId: true } },
          plantao: { select: { especialidade: true } },
        },
      },
      reservaSala: {
        select: { id: true, estado: true, profissional: { select: { userId: true } } },
      },
    },
  });

  if (!pagamento) return Response.json({ error: "Pagamento não encontrado" }, { status: 404 });
  if (pagamento.estado !== "PENDENTE") {
    return Response.json({ error: "Pagamento já processado" }, { status: 409 });
  }

  if (acao === "CONFIRMAR") {
    await prisma.$transaction(async (tx) => {
      await executarConfirmacao(id, tx);
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
        corpo: `Não foi possível confirmar a tua taxa de reserva para o plantão de ${pagamento.candidatura.plantao.especialidade}. Contacta o suporte.`,
        href: "/support",
      });
      return;
    }

    if (pagamento.plantao && !pagamento.candidaturaId) {
      await tx.plantao.update({ where: { id: pagamento.plantao.id }, data: { estado: "CANCELADO" } });
    }

    if (pagamento.reservaSala) {
      await tx.reservaSala.update({ where: { id: pagamento.reservaSala.id }, data: { estado: "CANCELADA" } });
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
