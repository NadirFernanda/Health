import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, getConsultorioFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.role !== "PROPRIETARIO_SALA") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const consultorio = await getConsultorioFromSession(session);
  if (!consultorio) return NextResponse.json({ error: "Consultório não encontrado" }, { status: 404 });

  const salas = await prisma.sala.findMany({
    where: { consultorioId: consultorio.id },
    include: { _count: { select: { reservas: true } } },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(
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

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.role !== "PROPRIETARIO_SALA") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const consultorio = await getConsultorioFromSession(session);
  if (!consultorio) return NextResponse.json({ error: "Consultório não encontrado" }, { status: 404 });

  const body = await req.json();
  const { nome, tipo, precoPorHora, descricao, ...equipamentos } = body;

  if (!nome || !tipo || !precoPorHora) {
    return NextResponse.json({ error: "Campos obrigatórios em falta" }, { status: 400 });
  }

  const sala = await prisma.sala.create({
    data: {
      consultorioId: consultorio.id,
      nome,
      tipo,
      precoPorHora: parseInt(precoPorHora),
      precoPorHoraCentavos: BigInt(parseInt(precoPorHora)) * 100n,
      zona: consultorio.zonaLuanda ?? "Outra",
      descricao: descricao ?? null,
      ...equipamentos,
    },
  });

  return NextResponse.json({ id: sala.id }, { status: 201 });
}
