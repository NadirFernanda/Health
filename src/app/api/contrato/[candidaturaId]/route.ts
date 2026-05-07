import { NextRequest } from "next/server";
import { requireSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

const TAXA_RESERVA_PERCENTAGEM = 0.10;

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

  // ASSINAR — médico aceita os termos, mas precisa de pagar uma taxa de reserva.
  // A candidatura fica em AGUARDANDO_PAGAMENTO até o admin confirmar o pagamento.
  const plantao = candidatura.plantao;
  const taxaReserva = Math.round(plantao.valorKwanzas * TAXA_RESERVA_PERCENTAGEM);

  let pagamentoId: string;

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.candidatura.update({
        where: { id: candidaturaId },
        data: {
          estado: "AGUARDANDO_PAGAMENTO",
          respondidoEm: new Date(),
          contratoAssinadoEm: new Date(),
        },
      });

      const pag = await tx.pagamento.create({
        data: {
          tipo: "TURNO",
          plantaoId: plantao.id,
          candidaturaId,
          beneficiarioProfissionalId: null,
          valorBrutoAoa: taxaReserva,
          comissaoAoa: taxaReserva,
          valorLiquidoAoa: 0,
          metodo: "TRANSFERENCIA_BANCARIA",
          estado: "PENDENTE",
        },
      });

      return pag;
    });

    pagamentoId = result.id;
  } catch (err) {
    console.error("[contrato] transaction failed:", err);
    return Response.json({ error: "Erro ao processar contrato. Tente novamente." }, { status: 500 });
  }

  return Response.json({
    estado: "AGUARDANDO_PAGAMENTO",
    pagamentoId,
    taxaReserva,
    especialidade: plantao.especialidade,
  });
}
