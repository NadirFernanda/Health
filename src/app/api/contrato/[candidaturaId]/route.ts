import { NextRequest } from "next/server";
import { requireSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { createEscrowPayment, processPaymentEscrow } from "@/lib/payment-service";

const COMISSAO_PERCENTAGEM = 0.10;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ candidaturaId: string }> }
) {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;

  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  const { candidaturaId } = await params;
  const { acao } = await request.json(); // "ASSINAR" | "RECUSAR"

  if (!["ASSINAR", "RECUSAR"].includes(acao)) {
    return Response.json({ error: "Ação inválida" }, { status: 400 });
  }

  const candidatura = await prisma.candidatura.findFirst({
    where: { id: candidaturaId, profissionalId: prof.id },
    include: {
      plantao: { include: { clinica: true } },
      profissional: true,
    },
  });

  if (!candidatura) return Response.json({ error: "Não encontrado" }, { status: 404 });

  if (candidatura.estado !== "CONTRATO_PENDENTE") {
    return Response.json({ error: "Contrato não está pendente de assinatura" }, { status: 409 });
  }

  if (acao === "RECUSAR") {
    let clinicaUserId: string | null = null;
    await prisma.$transaction(async (tx) => {
      await tx.candidatura.update({
        where: { id: candidaturaId },
        data: { estado: "RECUSADO", respondidoEm: new Date() },
      });

      if (candidatura.plantao.clinicaId) {
        const clinicaUser = await tx.clinica.findUnique({
          where: { id: candidatura.plantao.clinicaId },
          select: { userId: true },
        });
        if (clinicaUser) {
          clinicaUserId = clinicaUser.userId;
          await tx.notificacao.create({
            data: {
              userId: clinicaUser.userId,
              tipo: "CONTRATO",
              titulo: "Contrato recusado",
              corpo: `${prof.nome} recusou o contrato para o plantão de ${candidatura.plantao.especialidade}.`,
              href: `/clinica/plantoes/${candidatura.plantaoId}`,
            },
          });
        }
      }
    });
    if (clinicaUserId) {
      sendPushToUser(clinicaUserId, {
        title: "Contrato recusado",
        body: `${prof.nome} recusou o contrato para o plantão de ${candidatura.plantao.especialidade}.`,
        href: `/clinica/plantoes/${candidatura.plantaoId}`,
        tag: "CONTRATO",
      }).catch(() => {});
    }
    return Response.json({ estado: "RECUSADO" });
  }

  // ASSINAR: finalise the contract → ACEITE
  let pagamento: any = null;
  await prisma.$transaction(async (tx) => {
    const plantao = candidatura.plantao;

    await tx.candidatura.update({
      where: { id: candidaturaId },
      data: {
        estado: "ACEITE",
        respondidoEm: new Date(),
        contratoAssinadoEm: new Date(),
      },
    });

    // Create payment record in escrow with pending status
    const valorBruto = plantao.valorKwanzas;
    const comissao = Math.round(valorBruto * COMISSAO_PERCENTAGEM);
    const valorLiquido = valorBruto - comissao;

    pagamento = await createEscrowPayment(
      {
        tipo: "TURNO",
        plantaoId: candidatura.plantaoId,
        candidaturaId,
        beneficiarioProfissionalId: prof.id,
        valorBrutoAoa: valorBruto,
        comissaoAoa: comissao,
        valorLiquidoAoa: valorLiquido,
        metodo: "TRANSFERENCIA_BANCARIA",
      },
      tx
    );

    // Increment vacancies filled
    const novasVagasPreenchidas = plantao.vagasPreenchidas + 1;
    const novoEstadoPlantao = novasVagasPreenchidas >= plantao.vagas ? "FECHADO" : "ABERTO";

    await tx.plantao.update({
      where: { id: candidatura.plantaoId },
      data: { vagasPreenchidas: { increment: 1 }, estado: novoEstadoPlantao },
    });

    // Auto-reject remaining PENDENTE candidatures if plantão is now full
    if (novoEstadoPlantao === "FECHADO") {
      await tx.candidatura.updateMany({
        where: {
          plantaoId: candidatura.plantaoId,
          estado: "PENDENTE",
          id: { not: candidaturaId },
        },
        data: { estado: "RECUSADO", respondidoEm: new Date() },
      });
    }

    // Notify clinic that doctor signed
    if (plantao.clinicaId) {
      const clinicaUser = await tx.clinica.findUnique({
        where: { id: plantao.clinicaId },
        select: { userId: true },
      });
      if (clinicaUser) {
        await tx.notificacao.create({
          data: {
            userId: clinicaUser.userId,
            tipo: "CONTRATO",
            titulo: "Contrato assinado!",
            corpo: `${prof.nome} assinou o contrato para o plantão de ${plantao.especialidade}. O plantão está confirmado.`,
            href: `/clinica/plantoes/${candidatura.plantaoId}`,
          },
        });
        sendPushToUser(clinicaUser.userId, {
          title: "Contrato assinado!",
          body: `${prof.nome} assinou o contrato para o plantão de ${plantao.especialidade}.`,
          href: `/clinica/plantoes/${candidatura.plantaoId}`,
          tag: "CONTRATO",
        }).catch(() => {});
      }
    }
  });

  if (pagamento) {
    // Non-blocking: contract is already signed; payment processing failure
    // must not roll back the user-visible success response.
    processPaymentEscrow(pagamento.id).catch((err) => {
      console.error("[contrato] processPaymentEscrow failed:", err);
    });
  }

  return Response.json({ estado: "ACEITE" });
}
