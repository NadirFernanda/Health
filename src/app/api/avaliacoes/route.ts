import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof Response) return auth;
  const { session } = auth;

  const body = await request.json();
  const { estrelas, comentario, alvoClinicaId, alvoMedicoId, salaId, plantaoId } = body;

  if (!estrelas || estrelas < 1 || estrelas > 5) {
    return Response.json({ error: "Avaliação inválida (1-5 estrelas)" }, { status: 400 });
  }

  // Encontrar profissional se for MEDICO
  let autorId: string | undefined;
  if (session.role === "MEDICO") {
    const prof = await prisma.profissional.findUnique({ where: { userId: session.id } });
    if (prof) autorId = prof.id;
  }

  const avaliacao = await prisma.avaliacao.create({
    data: {
      estrelas,
      comentario,
      autorId,
      alvoClinicaId,
      alvoMedicoId,
      salaId,
      plantaoId,
    },
  });

  // Actualizar rating do alvo
  if (alvoClinicaId) {
    const stats = await prisma.avaliacao.aggregate({
      where: { alvoClinicaId },
      _avg: { estrelas: true },
      _count: { estrelas: true },
    });
    await prisma.clinica.update({
      where: { id: alvoClinicaId },
      data: { rating: stats._avg.estrelas ?? 0, totalAvaliacoes: stats._count.estrelas },
    });
  }
  if (alvoMedicoId) {
    const stats = await prisma.avaliacao.aggregate({
      where: { alvoMedicoId },
      _avg: { estrelas: true },
      _count: { estrelas: true },
    });
    await prisma.profissional.update({
      where: { id: alvoMedicoId },
      data: { rating: stats._avg.estrelas ?? 0, totalAvaliacoes: stats._count.estrelas },
    });
  }
  if (salaId) {
    const stats = await prisma.avaliacao.aggregate({
      where: { salaId },
      _avg: { estrelas: true },
      _count: { estrelas: true },
    });
    await prisma.sala.update({
      where: { id: salaId },
      data: { avaliacaoMedia: stats._avg.estrelas ?? 0, totalAvaliacoes: stats._count.estrelas },
    });
  }

  return Response.json({ id: avaliacao.id }, { status: 201 });
}
