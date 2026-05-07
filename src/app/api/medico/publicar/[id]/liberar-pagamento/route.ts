import { NextRequest } from "next/server";
import { requireSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { criarNotificacaoComPush } from "@/lib/push";
import { recalculateRevenueForProfessional } from "@/lib/payment-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;

  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  const { id: plantaoId } = await params;
  const { candidaturaId } = await request.json() as { candidaturaId: string };

  const candidatura = await prisma.candidatura.findFirst({
    where: {
      id: candidaturaId,
      plantaoId,
      plantao: { profissionalPublicadorId: prof.id },
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

  const jaLiberado = await prisma.pagamento.findFirst({
    where: { plantaoId, liberadoEm: { not: null } },
  });
  if (jaLiberado) {
    return Response.json({ error: "Pagamento já foi liberado anteriormente" }, { status: 409 });
  }

  const escrow = await prisma.pagamento.findFirst({
    where: { plantaoId, liberadoEm: null },
    orderBy: { criadoEm: "desc" },
  });

  const valorBruto = candidatura.plantao.valorKwanzas;
  const comissao = Math.round(valorBruto * 0.10);
  const valorLiquido = escrow?.valorLiquidoAoa ?? (valorBruto - comissao);
  const substitutoId = candidatura.profissional.id;

  await prisma.$transaction(async (tx) => {
    if (escrow) {
      await tx.pagamento.update({
        where: { id: escrow.id },
        data: {
          liberadoEm: new Date(),
          beneficiarioProfissionalId: substitutoId,
          candidaturaId,
        },
      });
    } else {
      await tx.pagamento.create({
        data: {
          tipo: "TURNO",
          plantaoId,
          candidaturaId,
          beneficiarioProfissionalId: substitutoId,
          valorBrutoAoa: valorBruto,
          comissaoAoa: comissao,
          valorLiquidoAoa: valorLiquido,
          metodo: "TRANSFERENCIA_BANCARIA",
          estado: "CONFIRMADO",
          liberadoEm: new Date(),
        },
      });
    }

    // Creditar carteira do médico substituto
    await tx.profissional.update({
      where: { id: substitutoId },
      data: {
        saldoCarteira: { increment: valorLiquido },
        saldoCarteiraCentavos: { increment: BigInt(valorLiquido) * 100n },
        totalPlantoes: { increment: 1 },
      },
    });

    await tx.transacaoCarteira.create({
      data: {
        profissionalId: substitutoId,
        tipo: "CREDITO",
        valorCentavos: BigInt(valorLiquido) * 100n,
        descricao: `Plantão concluído — ${candidatura.plantao.especialidade} — ${valorLiquido.toLocaleString()} AOA`,
        referencia: plantaoId,
        estado: "PROCESSADO",
      },
    });

    await recalculateRevenueForProfessional(substitutoId, tx as any);

    await criarNotificacaoComPush(tx, {
      userId: candidatura.profissional.userId,
      tipo: "PAGAMENTO",
      titulo: "Pagamento recebido!",
      corpo: `Recebeste ${valorLiquido.toLocaleString()} AOA pelo plantão de ${candidatura.plantao.especialidade}. O valor está disponível na tua carteira.`,
      href: `/medico/ganhos`,
    });
  });

  return Response.json({ liberado: true, valorLiquidoAoa: valorLiquido });
}
