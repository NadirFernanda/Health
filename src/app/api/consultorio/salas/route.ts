import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, getConsultorioFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const TIPOS_SALA = ["CONSULTORIO", "OBSERVACAO", "PROCEDIMENTOS", "SALA_CURATIVO", "OUTRO"] as const;

const criarSalaSchema = z.object({
  nome: z.string().min(2).max(120),
  tipo: z.enum(TIPOS_SALA),
  precoPorHora: z.number().int().min(500).max(5_000_000),
  descricao: z.string().max(2000).optional(),
  maca: z.boolean().default(false),
  estetoscopio: z.boolean().default(false),
  tensiometro: z.boolean().default(false),
  termometro: z.boolean().default(false),
  computador: z.boolean().default(false),
  materiaisBasicos: z.boolean().default(true),
  nebulizador: z.boolean().default(false),
  oximetro: z.boolean().default(false),
  glucometro: z.boolean().default(false),
  desfibrilador: z.boolean().default(false),
});

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

  let rawBody: unknown;
  try { rawBody = await req.json(); } catch { return NextResponse.json({ error: "Body inválido" }, { status: 400 }); }
  const parsed = criarSalaSchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });

  const {
    nome, tipo, precoPorHora, descricao,
    maca, estetoscopio, tensiometro, termometro, computador,
    materiaisBasicos, nebulizador, oximetro, glucometro, desfibrilador,
  } = parsed.data;

  const sala = await prisma.sala.create({
    data: {
      consultorioId: consultorio.id,
      nome,
      tipo,
      precoPorHora,
      precoPorHoraCentavos: BigInt(precoPorHora) * 100n,
      zona: consultorio.zonaLuanda ?? "Outra",
      descricao: descricao ?? null,
      maca, estetoscopio, tensiometro, termometro, computador,
      materiaisBasicos, nebulizador, oximetro, glucometro, desfibrilador,
    },
  });

  return NextResponse.json({ id: sala.id }, { status: 201 });
}
