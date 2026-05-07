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

  // ASSINAR — Step 1 (critical): update candidatura + plantao state only.
  // Keep this transaction minimal so a payment/notification failure can never
  // roll back the contract signing itself.
  const plantao = candidatura.plantao;
  let novoEstadoPlantao: "ABERTO" | "FECHADO" = "ABERTO";

  try {
    await prisma.$transaction(async (tx) => {
      await tx.candidatura.update({
        where: { id: candidaturaId },
        data: {
          estado: "ACEITE",
          respondidoEm: new Date(),
          contratoAssinadoEm: new Date(),
        },
      });

      const updated = await tx.plantao.update({
        where: { id: candidatura.plantaoId },
        data: { vagasPreenchidas: { increment: 1 } },
        select: { vagasPreenchidas: true, vagas: true },
      });

      novoEstadoPlantao = updated.vagasPreenchidas >= updated.vagas ? "FECHADO" : "ABERTO";

      if (novoEstadoPlantao === "FECHADO") {
        await tx.plantao.update({
          where: { id: candidatura.plantaoId },
          data: { estado: "FECHADO" },
        });
        await tx.candidatura.updateMany({
          where: {
            plantaoId: candidatura.plantaoId,
            estado: "PENDENTE",
            id: { not: candidaturaId },
          },
          data: { estado: "RECUSADO", respondidoEm: new Date() },
        });
      }
    });
  } catch (err) {
    console.error("[contrato] transaction failed:", err);
    return Response.json({ error: "Erro ao processar contrato. Tente novamente." }, { status: 500 });
  }

  // Step 2 (non-critical, fire-and-forget): payment record + notifications.
  // Failures here must never block the success response already committed above.
  const valorBruto = plantao.valorKwanzas;
  const comissao = Math.round(valorBruto * COMISSAO_PERCENTAGEM);
  const valorLiquido = valorBruto - comissao;

  createEscrowPayment(
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
    prisma
  )
    .then((p) => processPaymentEscrow(p.id))
    .catch((err) => console.error("[contrato] payment creation failed:", err));

  if (plantao.clinicaId) {
    prisma.clinica
      .findUnique({ where: { id: plantao.clinicaId }, select: { userId: true } })
      .then(async (clinicaUser) => {
        if (!clinicaUser) return;
        await prisma.notificacao.create({
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
      })
      .catch((err) => console.error("[contrato] notification failed:", err));
  }

  return Response.json({ estado: "ACEITE" });
}
