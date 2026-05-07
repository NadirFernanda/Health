import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, getConsultorioFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

async function getSala(salaId: string, consultorioId: string) {
  return prisma.sala.findFirst({ where: { id: salaId, consultorioId } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session || session.role !== "PROPRIETARIO_SALA")
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const consultorio = await getConsultorioFromSession(session);
  if (!consultorio) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const sala = await prisma.sala.findFirst({
    where: { id, consultorioId: consultorio.id },
    include: { _count: { select: { reservas: true } } },
  });
  if (!sala) return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });

  return NextResponse.json({
    id: sala.id,
    nome: sala.nome,
    tipo: sala.tipo,
    precoPorHora: sala.precoPorHora,
    zona: sala.zona,
    descricao: sala.descricao ?? "",
    disponivel: sala.disponivel,
    avaliacaoMedia: sala.avaliacaoMedia,
    totalAvaliacoes: sala.totalAvaliacoes,
    totalReservas: sala._count.reservas,
    equipamentos: {
      maca: sala.maca, estetoscopio: sala.estetoscopio, tensiometro: sala.tensiometro,
      termometro: sala.termometro, computador: sala.computador, materiaisBasicos: sala.materiaisBasicos,
      nebulizador: sala.nebulizador, oximetro: sala.oximetro, glucometro: sala.glucometro,
      desfibrilador: sala.desfibrilador,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session || session.role !== "PROPRIETARIO_SALA")
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const consultorio = await getConsultorioFromSession(session);
  if (!consultorio) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const sala = await getSala(id, consultorio.id);
  if (!sala) return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });

  const body = await req.json();
  const {
    nome, tipo, precoPorHora, descricao, disponivel,
    maca, estetoscopio, tensiometro, termometro, computador,
    materiaisBasicos, nebulizador, oximetro, glucometro, desfibrilador,
  } = body;

  const updated = await prisma.sala.update({
    where: { id },
    data: {
      ...(nome !== undefined && { nome }),
      ...(tipo !== undefined && { tipo }),
      ...(precoPorHora !== undefined && {
        precoPorHora: parseInt(precoPorHora),
        precoPorHoraCentavos: BigInt(parseInt(precoPorHora)) * 100n,
      }),
      ...(descricao !== undefined && { descricao }),
      ...(disponivel !== undefined && { disponivel }),
      ...(maca !== undefined && { maca }),
      ...(estetoscopio !== undefined && { estetoscopio }),
      ...(tensiometro !== undefined && { tensiometro }),
      ...(termometro !== undefined && { termometro }),
      ...(computador !== undefined && { computador }),
      ...(materiaisBasicos !== undefined && { materiaisBasicos }),
      ...(nebulizador !== undefined && { nebulizador }),
      ...(oximetro !== undefined && { oximetro }),
      ...(glucometro !== undefined && { glucometro }),
      ...(desfibrilador !== undefined && { desfibrilador }),
    },
  });

  return NextResponse.json({ id: updated.id, disponivel: updated.disponivel });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session || session.role !== "PROPRIETARIO_SALA")
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const consultorio = await getConsultorioFromSession(session);
  if (!consultorio) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const sala = await getSala(id, consultorio.id);
  if (!sala) return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });

  await prisma.sala.update({ where: { id }, data: { ativo: false, disponivel: false } });
  return NextResponse.json({ ok: true });
}
