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
      estado: "CONCLUIDO",
      plantao: { clinicaId: clinica.id },
    },
    include: {
      plantao: true,
      profissional: { select: { id: true, userId: true, nome: true } },
    },
  });

  if (!candidatura) {
    return Response.json({ error: "Candidatura não encontrada ou não está no estado CONCLUIDO" }, { status: 404 });
  }

  // Encontrar o pagamento escrow — aceita qualquer estado (PENDENTE ou CONFIRMADO)
  const escrow = await prisma.pagamento.findFirst({
    where: {
      plantaoId,
      OR: [
        { candidaturaId },
        { beneficiarioProfissionalId: candidatura.profissional.id },
        { tipo: "TURNO" },
      ],
      liberadoEm: null,
    },
    orderBy: { criadoEm: "desc" },
  });

  if (!escrow) {
    return Response.json({ error: "Pagamento escrow não encontrado ou já liberado" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    // Liberar o escrow para o médico
    await tx.pagamento.update({
      where: { id: escrow.id },
      data: { liberadoEm: new Date() },
    });

    // Notificar o médico
    await criarNotificacaoComPush(tx, {
      userId: candidatura.profissional.userId,
      tipo: "PAGAMENTO",
      titulo: "Pagamento liberado!",
      corpo: `O teu pagamento de ${escrow.valorLiquidoAoa.toLocaleString()} AOA pelo plantão de ${candidatura.plantao.especialidade} foi liberado.`,
      href: `/medico/ganhos`,
    });
  });

  return Response.json({ liberado: true, valorLiquidoAoa: escrow.valorLiquidoAoa });
}
