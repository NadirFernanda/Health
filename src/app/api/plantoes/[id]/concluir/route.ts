import { NextRequest } from "next/server";
import { getAuthSession, getClinicaFromSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

/**
 * PATCH /api/plantoes/[id]/concluir
 * Marca um plantão como CONCLUIDO e libera o pagamento escrow ao médico substituto.
 * Pode ser chamado pela clínica (que publicou) ou pelo médico-publicador.
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: plantaoId } = await params;

  const session = await getAuthSession();
  if (!session) return Response.json({ error: "Não autenticado" }, { status: 401 });

  // Descobrir quem está a chamar e verificar ownership
  let autorizado = false;

  if (session.role === "CLINICA") {
    const clinica = await getClinicaFromSession(session);
    if (clinica) {
      const p = await prisma.plantao.findFirst({ where: { id: plantaoId, clinicaId: clinica.id } });
      autorizado = !!p;
    }
  } else if (session.role === "MEDICO") {
    const prof = await getProfissionalFromSession(session);
    if (prof) {
      const p = await prisma.plantao.findFirst({ where: { id: plantaoId, profissionalPublicadorId: prof.id } });
      autorizado = !!p;
    }
  }

  if (!autorizado) {
    return Response.json({ error: "Sem permissão para concluir este plantão" }, { status: 403 });
  }

  // Buscar plantão com pagamento pendente de libertação
  const plantao = await prisma.plantao.findUnique({
    where: { id: plantaoId },
    include: {
      pagamentos: {
        where: { tipo: "TURNO", estado: "CONFIRMADO" },
      },
    },
  });

  if (!plantao) return Response.json({ error: "Plantão não encontrado" }, { status: 404 });
  if (plantao.estado === "CONCLUIDO") return Response.json({ error: "Plantão já concluído" }, { status: 409 });
  if (!["ABERTO", "FECHADO", "EM_ANDAMENTO"].includes(plantao.estado)) {
    return Response.json({ error: "Estado inválido para concluir" }, { status: 400 });
  }

  const agora = new Date();

  // Transação: marcar plantão CONCLUIDO + liberar cada pagamento escrow ao beneficiário
  await prisma.$transaction(async (tx) => {
    // 1. Concluir o plantão
    await tx.plantao.update({
      where: { id: plantaoId },
      data: { estado: "CONCLUIDO" },
    });

    // 2. Para cada pagamento retido, libertar para o médico beneficiário
    for (const pag of plantao.pagamentos) {
      if (!pag.beneficiarioProfissionalId) continue;

      // Marcar pagamento como PROCESSADO (libertado)
      await tx.pagamento.update({
        where: { id: pag.id },
        data: { estado: "PROCESSADO", liberadoEm: agora },
      });

      // Creditar saldo na carteira do médico
      await tx.profissional.update({
        where: { id: pag.beneficiarioProfissionalId },
        data: {
          saldoCarteira: { increment: pag.valorLiquidoAoa },
          saldoCarteiraCentavos: { increment: BigInt(pag.valorLiquidoAoa) * 100n },
          totalPlantoes: { increment: 1 },
        },
      });

      // Registar transação na carteira
      await tx.transacaoCarteira.create({
        data: {
          profissionalId: pag.beneficiarioProfissionalId,
          tipo: "CREDITO",
          valorCentavos: BigInt(pag.valorLiquidoAoa) * 100n,
          descricao: `Pagamento plantão concluído — ${pag.valorLiquidoAoa.toLocaleString()} AOA`,
          referencia: plantaoId,
          estado: "PROCESSADO",
        },
      });

      // Notificar o médico
      const prof = await tx.profissional.findUnique({
        where: { id: pag.beneficiarioProfissionalId },
        select: { userId: true },
      });
      if (prof) {
        await tx.notificacao.create({
          data: {
            userId: prof.userId,
            tipo: "PAGAMENTO",
            titulo: "Pagamento recebido!",
            corpo: `Recebeste ${pag.valorLiquidoAoa.toLocaleString()} AOA pelo plantão concluído. O valor está disponível na tua carteira.`,
            href: "/medico/ganhos",
          },
        });
      }
    }
  });

  return Response.json({ sucesso: true, plantaoId, estado: "CONCLUIDO" });
}
