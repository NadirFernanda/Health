import { NextRequest } from "next/server";
import { getAuthSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ plantaoId: string }> }
) {
  const session = await getAuthSession();
  if (!session || session.role !== "MEDICO") {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const prof = await getProfissionalFromSession(session);
  if (!prof) return Response.json({ error: "Profissional não encontrado" }, { status: 404 });

  const { plantaoId } = await params;
  const { candidaturaId, estado } = await request.json() as { candidaturaId: string; estado: string };

  if (!candidaturaId || !["CONTRATO_PENDENTE", "RECUSADO"].includes(estado)) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Verify this plantão belongs to the requesting médico
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
      body: `O médico publicador aceitou a sua candidatura para o plantão de ${candidatura.plantao.especialidade}.`,
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
  }

  if (estado === "RECUSADO") {
    const pushData = {
      userId: candidatura.profissional.userId,
      title: "Candidatura não seleccionada",
      body: `A tua candidatura para o plantão de ${candidatura.plantao.especialidade} não foi seleccionada desta vez.`,
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
  }

  return Response.json({ estado });
}
