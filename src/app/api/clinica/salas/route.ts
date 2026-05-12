import { NextRequest } from "next/server";
import { requireSession, getClinicaFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const TIPOS_SALA = ["CONSULTORIO", "OBSERVACAO", "PROCEDIMENTOS", "SALA_CURATIVO", "OUTRO"] as const;

const criarSalaSchema = z.object({
  nome: z.string().min(2).max(120),
  tipo: z.enum(TIPOS_SALA),
  precoPorHora: z.number().int().min(500).max(5_000_000),
  zona: z.string().min(2).max(100),
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

  let rawBody: unknown;
  try { rawBody = await request.json(); } catch { return Response.json({ error: "Body inválido" }, { status: 400 }); }
  const parsed = criarSalaSchema.safeParse(rawBody);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });

  const {
    nome, tipo, precoPorHora, zona, descricao,
    maca, estetoscopio, tensiometro, termometro, computador,
    materiaisBasicos, nebulizador, oximetro, glucometro, desfibrilador,
  } = parsed.data;

  const sala = await prisma.sala.create({
    data: {
      clinicaId: clinica.id,
      nome,
      tipo,
      precoPorHora,
      precoPorHoraCentavos: BigInt(precoPorHora) * 100n,
      zona,
      descricao: descricao ?? null,
      maca, estetoscopio, tensiometro, termometro, computador,
      materiaisBasicos, nebulizador, oximetro, glucometro, desfibrilador,
    },
  });

  return Response.json({ id: sala.id }, { status: 201 });
}
