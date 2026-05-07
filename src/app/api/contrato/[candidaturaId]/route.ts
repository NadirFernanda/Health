import { NextRequest } from "next/server";
import { requireSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { criarNotificacaoComPush } from "@/lib/push";

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
    await prisma.$transaction(async (tx) => {
      await tx.candidatura.update({
        where: { id: candidaturaId },
        data: { estado: "RECUSADO", respondidoEm: new Date() },
      });

      // Re-open the shift if it was closed while waiting for this contract signature
      const plantaoAtual = await tx.plantao.findUnique({
        where: { id: candidatura.plantao.id },
        select: { estado: true, vagasPreenchidas: true, vagas: true },
      });
      if (plantaoAtual?.estado === "FECHADO" && plantaoAtual.vagasPreenchidas < plantaoAtual.vagas) {
        await tx.plantao.update({ where: { id: candidatura.plantao.id }, data: { estado: "ABERTO" } });
      }

      if (candidatura.plantao.clinicaId) {
        const clinicaUser = await tx.clinica.findUnique({
          where: { id: candidatura.plantao.clinicaId },
          select: { userId: true },
        });
        if (clinicaUser) {
          await criarNotificacaoComPush(tx, {
            userId: clinicaUser.userId,
            tipo: "CONTRATO",
            titulo: "Contrato recusado",
            corpo: `${prof.nome} recusou o contrato para o plantão de ${candidatura.plantao.especialidade}.`,
            href: `/clinica/plantoes/${candidatura.plantaoId}`,
          });
        }
      }
    });
    return Response.json({ estado: "RECUSADO" });
  }

  // ASSINAR — aceitar directamente sem pagamento antecipado (comissão de 10% deduzida no escrow)
  const plantao = candidatura.plantao;

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
      where: { id: plantao.id },
      data: { vagasPreenchidas: { increment: 1 } },
      select: { vagasPreenchidas: true, vagas: true },
    });

    if (updated.vagasPreenchidas >= updated.vagas) {
      await tx.plantao.update({ where: { id: plantao.id }, data: { estado: "FECHADO" } });
      await tx.candidatura.updateMany({
        where: { plantaoId: plantao.id, estado: "PENDENTE", id: { not: candidaturaId } },
        data: { estado: "RECUSADO", respondidoEm: new Date() },
      });
    }

    // Ligar médico como beneficiário do escrow da clínica
    const escrow = await tx.pagamento.findFirst({
      where: { plantaoId: plantao.id, estado: "CONFIRMADO", beneficiarioProfissionalId: null, candidaturaId: null },
    });
    if (escrow) {
      await tx.pagamento.update({
        where: { id: escrow.id },
        data: { beneficiarioProfissionalId: prof.id, candidaturaId },
      });
    }

    await criarNotificacaoComPush(tx, {
      userId: prof.userId,
      tipo: "CONTRATO",
      titulo: "Contrato assinado!",
      corpo: `Assinaste o contrato para o plantão de ${plantao.especialidade}. Estás confirmado.`,
      href: `/medico/plantoes/${plantao.id}`,
    });

    if (plantao.clinica?.userId) {
      await criarNotificacaoComPush(tx, {
        userId: plantao.clinica.userId,
        tipo: "CONTRATO",
        titulo: "Médico confirmado!",
        corpo: `${prof.nome} assinou o contrato para o plantão de ${plantao.especialidade}.`,
        href: `/clinica/plantoes/${plantao.id}`,
      });
    }
  });

  return Response.json({ estado: "ACEITE" });
}
