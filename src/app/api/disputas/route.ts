import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  candidaturaId: z.string().min(1),
  tipo: z.enum(["NAO_COMPARECEU", "NAO_PAGOU", "QUALIDADE", "CANCELAMENTO", "OUTRO"]),
  descricao: z.string().min(20).max(2000),
});

export async function GET() {
  const auth = await requireSession();
  if (auth instanceof Response) return auth;
  const { session } = auth;

  const disputas = await prisma.disputa.findMany({
    where: { iniciadoPorId: session.id },
    include: {
      candidatura: {
        include: {
          plantao: { select: { especialidade: true, dataInicio: true, clinica: { select: { nome: true } }, profissionalPublicador: { select: { nome: true } } } },
          profissional: { select: { nome: true } },
        },
      },
      mensagens: { orderBy: { criadoEm: "desc" }, take: 1 },
    },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(disputas.map((d) => ({
    id: d.id,
    tipo: d.tipo,
    estado: d.estado,
    descricao: d.descricao,
    criadoEm: d.criadoEm,
    resolvidoEm: d.resolvidoEm,
    plantaoEspecialidade: d.candidatura.plantao.especialidade,
    plantaoData: d.candidatura.plantao.dataInicio,
    contraparte: d.candidatura.plantao.clinica?.nome ?? d.candidatura.plantao.profissionalPublicador?.nome ?? "—",
    totalMensagens: d.mensagens.length,
  })));
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof Response) return auth;
  const { session } = auth;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }
  const { candidaturaId, tipo, descricao } = parsed.data;

  // Verify the candidatura belongs to this user
  const candidatura = await prisma.candidatura.findUnique({
    where: { id: candidaturaId },
    include: {
      profissional: { select: { userId: true } },
      plantao: { select: { clinicaId: true, clinica: { select: { userId: true } } } },
    },
  });
  if (!candidatura) return NextResponse.json({ error: "Candidatura não encontrada" }, { status: 404 });

  const isMedico = candidatura.profissional.userId === session.id;
  const isClinica = candidatura.plantao.clinica?.userId === session.id;
  if (!isMedico && !isClinica) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // Only one open dispute per candidatura per user
  const existing = await prisma.disputa.findFirst({
    where: { candidaturaId, iniciadoPorId: session.id, estado: { in: ["ABERTA", "EM_ANALISE"] } },
  });
  if (existing) {
    return NextResponse.json({ error: "Já tens uma disputa aberta para esta candidatura" }, { status: 409 });
  }

  const disputa = await prisma.disputa.create({
    data: { candidaturaId, iniciadoPorId: session.id, tipo, descricao },
  });

  return NextResponse.json({ id: disputa.id }, { status: 201 });
}
