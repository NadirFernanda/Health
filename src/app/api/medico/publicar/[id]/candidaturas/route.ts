import { NextRequest } from "next/server";
import { requireSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { createEscrowPayment, processPaymentEscrow } from "@/lib/payment-service";
import { sendPushToUser } from "@/lib/push";

// Comissão da plataforma: 10%
const COMISSAO_PERCENTAGEM = 0.10;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;
  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  const { id: plantaoId } = await params;

  // Garantir que o plantão pertence a este médico
  const plantao = await prisma.plantao.findFirst({
    where: { id: plantaoId, profissionalPublicadorId: prof.id },
  });
  if (!plantao) return Response.json({ error: "Não encontrado" }, { status: 404 });

  const candidaturas = await prisma.candidatura.findMany({
    where: { plantaoId },
    include: { profissional: true },
    orderBy: { criadoEm: "desc" },
  });

  return Response.json(
    candidaturas.map((c) => ({
      id: c.id,
      estado: c.estado,
      criadoEm: c.criadoEm.toISOString(),
      profissional: {
        id: c.profissional.id,
        nome: c.profissional.nome,
        tipo: c.profissional.tipo,
        especialidade: c.profissional.especialidade,
        numeroSinome: c.profissional.numeroSinome ?? "",
        rating: c.profissional.rating,
        totalAvaliacoes: c.profissional.totalAvaliacoes,
        totalPlantoes: c.profissional.totalPlantoes,
        verified: c.profissional.verified,
        bio: c.profissional.bio ?? "",
      },
    }))
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;
  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  const { id: plantaoId } = await params;
  const { candidaturaId, estado } = await request.json();

  if (!candidaturaId || !["CONTRATO_PENDENTE", "ACEITE", "RECUSADO"].includes(estado)) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Verificar que a candidatura pertence a um plantão publicado por este médico
  const candidatura = await prisma.candidatura.findFirst({
    where: {
      id: candidaturaId,
      plantaoId,
      plantao: { profissionalPublicadorId: prof.id },
    },
    include: { plantao: true, profissional: true },
  });
  if (!candidatura) return Response.json({ error: "Não encontrado" }, { status: 404 });

  if (estado === "CONTRATO_PENDENTE") {
    const pushData = {
      userId: candidatura.profissional.userId,
      title: "Contrato para assinar",
      body: `O médico aceitou a sua candidatura para o plantão de ${candidatura.plantao.especialidade}.`,
      href: `/medico/plantoes/${plantaoId}/contrato`,
    };
    await prisma.$transaction(async (tx) => {
      await tx.candidatura.update({
        where: { id: candidaturaId },
        data: { estado: "CONTRATO_PENDENTE", contratoGeradoEm: new Date() },
      });
      await tx.notificacao.create({
        data: {
          userId: pushData.userId,
          tipo: "CONTRATO",
          titulo: pushData.title,
          corpo: pushData.body,
          href: pushData.href,
        },
      });
    });
    sendPushToUser(pushData.userId, { title: pushData.title, body: pushData.body, href: pushData.href, tag: "CONTRATO" }).catch(() => {});
    return Response.json({ estado: "CONTRATO_PENDENTE" });
  }

  if (estado === "RECUSADO") {
    const pushData = {
      userId: candidatura.profissional.userId,
      title: "Candidatura não seleccionada",
      body: `A tua candidatura para o plantão de ${candidatura.plantao.especialidade} não foi seleccionada.`,
      href: "/medico/buscar",
    };
    await prisma.$transaction(async (tx) => {
      await tx.candidatura.update({
        where: { id: candidaturaId },
        data: { estado: "RECUSADO", respondidoEm: new Date() },
      });
      await tx.notificacao.create({
        data: {
          userId: pushData.userId,
          tipo: "CANDIDATURA",
          titulo: pushData.title,
          corpo: pushData.body,
          href: pushData.href,
        },
      });
    });
    sendPushToUser(pushData.userId, { title: pushData.title, body: pushData.body, href: pushData.href, tag: "CANDIDATURA" }).catch(() => {});
    return Response.json({ estado: "RECUSADO" });
  }

  // ACEITE direto (legado — mantido para compatibilidade)
  const updated = await prisma.candidatura.update({
    where: { id: candidaturaId },
    data: { estado, respondidoEm: new Date() },
  });

  let pagamento;
  const valorBruto = candidatura.plantao.valorKwanzas;
  const comissao = Math.round(valorBruto * COMISSAO_PERCENTAGEM);
  const valorLiquido = valorBruto - comissao;
  pagamento = await createEscrowPayment(
    {
      tipo: "TURNO",
      plantaoId,
      candidaturaId,
      beneficiarioProfissionalId: candidatura.profissionalId,
      valorBrutoAoa: valorBruto,
      comissaoAoa: comissao,
      valorLiquidoAoa: valorLiquido,
      metodo: "TRANSFERENCIA_BANCARIA",
    },
    prisma
  );
  if (pagamento) await processPaymentEscrow(pagamento.id);

  return Response.json({ id: updated.id, estado: updated.estado });
}
