import { NextRequest } from "next/server";
import { requireSession, getClinicaFromSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

async function getCandidaturaAndVerifyAccess(candidaturaId: string, session: { id: string; role: string }) {
  const candidatura = await prisma.candidatura.findUnique({
    where: { id: candidaturaId },
    include: {
      plantao: { include: { clinica: true } },
      profissional: true,
    },
  });
  if (!candidatura) return null;

  if (session.role === "CLINICA") {
    const clinica = await getClinicaFromSession(session as never);
    if (!clinica || candidatura.plantao.clinicaId !== clinica.id) return null;
  } else if (session.role === "MEDICO") {
    const prof = await getProfissionalFromSession(session as never);
    if (!prof || candidatura.profissionalId !== prof.id) return null;
  } else {
    return null;
  }

  return candidatura;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ candidaturaId: string }> }
) {
  const auth = await requireSession();
  if (auth instanceof Response) return auth;
  const { session } = auth;
  const { candidaturaId } = await params;

  const candidatura = await getCandidaturaAndVerifyAccess(candidaturaId, session);
  if (!candidatura) return Response.json({ error: "Não encontrado" }, { status: 404 });

  // Marcar mensagens não lidas como lidas para o utilizador actual
  await prisma.mensagem.updateMany({
    where: { candidaturaId, lida: false, autorUserId: { not: session.id } },
    data: { lida: true },
  });

  const mensagens = await prisma.mensagem.findMany({
    where: { candidaturaId },
    orderBy: { criadoEm: "asc" },
  });

  const outroNome =
    session.role === "CLINICA"
      ? candidatura.profissional.nome
      : (candidatura.plantao.clinica?.nome ?? "Médico");

  return Response.json({
    candidaturaId,
    estado: candidatura.estado,
    mensagemInicial: candidatura.mensagem ?? null,
    plantao: {
      id: candidatura.plantao.id,
      especialidade: candidatura.plantao.especialidade,
      dataInicio: candidatura.plantao.dataInicio.toISOString(),
    },
    outroParticipante: { nome: outroNome },
    mensagens: mensagens.map((m) => ({
      id: m.id,
      corpo: m.corpo,
      autorUserId: m.autorUserId,
      isMe: m.autorUserId === session.id,
      lida: m.lida,
      criadoEm: m.criadoEm.toISOString(),
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ candidaturaId: string }> }
) {
  const auth = await requireSession();
  if (auth instanceof Response) return auth;
  const { session } = auth;
  const { candidaturaId } = await params;

  const candidatura = await getCandidaturaAndVerifyAccess(candidaturaId, session);
  if (!candidatura) return Response.json({ error: "Não encontrado" }, { status: 404 });

  const { corpo } = await req.json();
  if (!corpo || typeof corpo !== "string" || corpo.trim().length === 0) {
    return Response.json({ error: "Mensagem vazia" }, { status: 400 });
  }
  if (corpo.trim().length > 1000) {
    return Response.json({ error: "Mensagem demasiado longa (máx. 1000 caracteres)" }, { status: 400 });
  }

  const mensagem = await prisma.mensagem.create({
    data: { candidaturaId, autorUserId: session.id, corpo: corpo.trim() },
  });

  // Notificar o outro participante
  const destinatarioUserId =
    session.role === "CLINICA"
      ? candidatura.profissional.userId
      : candidatura.plantao.clinica?.userId;

  if (destinatarioUserId) {
    const remetenteNome =
      session.role === "CLINICA"
        ? (candidatura.plantao.clinica?.nome ?? "Clínica")
        : candidatura.profissional.nome;
    const snippet = corpo.trim().slice(0, 80) + (corpo.trim().length > 80 ? "…" : "");
    const href =
      session.role === "CLINICA"
        ? `/medico/plantoes/${candidatura.plantao.id}/mensagens`
        : `/clinica/plantoes/${candidatura.plantao.id}/mensagens/${candidaturaId}`;

    await prisma.notificacao.create({
      data: {
        userId: destinatarioUserId,
        tipo: "MENSAGEM",
        titulo: `Nova mensagem de ${remetenteNome}`,
        corpo: snippet,
        href,
      },
    });
    sendPushToUser(destinatarioUserId, {
      title: `Nova mensagem de ${remetenteNome}`,
      body: snippet,
      href,
      tag: "MENSAGEM",
    }).catch(() => {});
  }

  return Response.json({
    id: mensagem.id,
    corpo: mensagem.corpo,
    autorUserId: mensagem.autorUserId,
    isMe: true,
    lida: false,
    criadoEm: mensagem.criadoEm.toISOString(),
  }, { status: 201 });
}
