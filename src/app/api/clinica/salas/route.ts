import { NextRequest } from "next/server";
import { requireSession, getClinicaFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;
  const clinica = await getClinicaFromSession(auth.session);
  if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

  const salas = await prisma.sala.findMany({
    where: { clinicaId: clinica.id },
    include: { _count: { select: { reservas: true } } },
    orderBy: { criadoEm: "desc" },
  });

  return Response.json(
    salas.map((s) => ({
      id: s.id,
      nome: s.nome,
      tipo: s.tipo,
      precoPorHora: s.precoPorHora,
      zona: s.zona,
      disponivel: s.disponivel,
      avaliacaoMedia: s.avaliacaoMedia,
      totalAvaliacoes: s.totalAvaliacoes,
      totalReservas: s._count.reservas,
    }))
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;
  const clinica = await getClinicaFromSession(auth.session);
  if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

  const body = await request.json();
  const { nome, tipo, precoPorHora, zona, descricao, equipamentos } = body;

  if (!nome || !tipo || !precoPorHora || !zona) {
    return Response.json({ error: "Campos obrigatórios em falta" }, { status: 400 });
  }

  const sala = await prisma.sala.create({
    data: {
      clinicaId: clinica.id,
      nome,
      tipo,
      precoPorHora: parseInt(precoPorHora),
      precoPorHoraCentavos: BigInt(parseInt(precoPorHora)) * 100n,
      zona,
      descricao,
      ...(equipamentos ?? {}),
    },
  });

  return Response.json({ id: sala.id }, { status: 201 });
}
