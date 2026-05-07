import { NextRequest } from "next/server";
import { requireSession, getClinicaFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { criarNotificacaoComPush } from "@/lib/push";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;

  const clinica = await getClinicaFromSession(auth.session);
  if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

  const { id: plantaoId } = await params;
  const { candidaturaId } = await request.json() as { candidaturaId: string };

  const candidatura = await prisma.candidatura.findFirst({
    where: {
      id: candidaturaId,
      plantaoId,
      plantao: { clinicaId: clinica.id },
    },
    include: {
      plantao: true,
      profissional: { select: { id: true, userId: true, nome: true } },
    },
  });

  if (!candidatura) {
    return Response.json({ error: "Candidatura não encontrada" }, { status: 404 });
  }

  if (candidatura.estado !== "CONCLUIDO") {
    return Response.json({ error: "O médico ainda não terminou o plantão" }, { status: 409 });
  }

  // Find existing escrow — try by plantaoId alone (simplest, most reliable)
  let escrow = await prisma.pagamento.findFirst({
    where: { plantaoId, liberadoEm: null },
    orderBy: { criadoEm: "desc" },
  });

  // Check if already released
  if (!escrow) {
    const jaLiberado = await prisma.pagamento.findFirst({
      where: { plantaoId, liberadoEm: { not: null } },
    });
    if (jaLiberado) {
      return Response.json({ error: "Pagamento já foi liberado anteriormente" }, { status: 409 });
    }
  }

  const valorBruto = candidatura.plantao.valorKwanzas;
  const comissao = Math.round(valorBruto * 0.10);
  const valorLiquido = escrow?.valorLiquidoAoa ?? (valorBruto - comissao);

  await prisma.$transaction(async (tx) => {
    if (escrow) {
      await tx.pagamento.update({
        where: { id: escrow.id },
        data: {
          liberadoEm: new Date(),
          beneficiarioProfissionalId: candidatura.profissional.id,
          candidaturaId,
        },
      });
    } else {
      // No pagamento record exists — create and release in one step
      await tx.pagamento.create({
        data: {
          tipo: "TURNO",
          plantaoId,
          candidaturaId,
          beneficiarioProfissionalId: candidatura.profissional.id,
          valorBrutoAoa: valorBruto,
          comissaoAoa: comissao,
          valorLiquidoAoa: valorLiquido,
          metodo: "TRANSFERENCIA_BANCARIA",
          estado: "CONFIRMADO",
          liberadoEm: new Date(),
        },
      });
    }

    await criarNotificacaoComPush(tx, {
      userId: candidatura.profissional.userId,
      tipo: "PAGAMENTO",
      titulo: "Pagamento liberado!",
      corpo: `O teu pagamento de ${valorLiquido.toLocaleString()} AOA pelo plantão de ${candidatura.plantao.especialidade} foi liberado.`,
      href: `/medico/ganhos`,
    });
  });

  return Response.json({ liberado: true, valorLiquidoAoa: valorLiquido });
}
