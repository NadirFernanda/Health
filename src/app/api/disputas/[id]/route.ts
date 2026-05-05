import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

async function getDisputaWithAccess(id: string, userId: string) {
  const disputa = await prisma.disputa.findUnique({
    where: { id },
    include: {
      candidatura: {
        include: {
          profissional: { select: { userId: true, nome: true } },
          plantao: { select: { especialidade: true, dataInicio: true, clinica: { select: { userId: true, nome: true } }, profissionalPublicador: { select: { nome: true } } } },
        },
      },
      mensagens: {
        include: { autor: { select: { id: true, role: true } } },
        orderBy: { criadoEm: "asc" },
      },
      iniciadoPor: { select: { id: true, role: true } },
    },
  });
  if (!disputa) return null;

  const isMedico = disputa.candidatura.profissional.userId === userId;
  const isClinica = disputa.candidatura.plantao.clinica?.userId === userId;
  const isAdmin = disputa.iniciadoPor.id === userId || isMedico || isClinica;
  if (!isAdmin) return null;

  return { disputa, isMedico, isClinica };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSession();
  if (auth instanceof Response) return auth;
  const { session } = auth;

  const result = await getDisputaWithAccess(id, session.id);
  if (!result) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { disputa } = result;
  return NextResponse.json({
    id: disputa.id,
    tipo: disputa.tipo,
    estado: disputa.estado,
    descricao: disputa.descricao,
    resolucaoNota: disputa.resolucaoNota,
    ajusteValorKz: disputa.ajusteValorKz,
    criadoEm: disputa.criadoEm,
    resolvidoEm: disputa.resolvidoEm,
    plantaoEspecialidade: disputa.candidatura.plantao.especialidade,
    plantaoData: disputa.candidatura.plantao.dataInicio,
    medicoNome: disputa.candidatura.profissional.nome,
    clinicaNome: disputa.candidatura.plantao.clinica?.nome ?? disputa.candidatura.plantao.profissionalPublicador?.nome ?? "—",
    mensagens: disputa.mensagens.map((m) => ({
      id: m.id,
      corpo: m.corpo,
      criadoEm: m.criadoEm,
      autorId: m.autorId,
      autorRole: m.autor.role,
    })),
  });
}

const msgSchema = z.object({ corpo: z.string().min(1).max(2000) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSession();
  if (auth instanceof Response) return auth;
  const { session } = auth;

  const result = await getDisputaWithAccess(id, session.id);
  if (!result) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  if (result.disputa.estado === "RESOLVIDA" || result.disputa.estado === "ENCERRADA") {
    return NextResponse.json({ error: "Disputa já encerrada" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = msgSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 });

  const msg = await prisma.disputaMensagem.create({
    data: { disputaId: id, autorId: session.id, corpo: parsed.data.corpo },
  });

  return NextResponse.json({ id: msg.id }, { status: 201 });
}
