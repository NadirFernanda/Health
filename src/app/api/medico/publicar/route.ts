import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession, getProfissionalFromSession } from "@/lib/api-auth";
import { z } from "zod";

const TIPOS_PROFISSIONAL = ["MEDICO", "ENFERMEIRO", "TECNICO_SAUDE", "OUTRO"] as const;
const METODOS_PAGAMENTO = ["MULTICAIXA_EXPRESS", "TPA", "TRANSFERENCIA_BANCARIA"] as const;

const isoDateString = z.string().refine((s) => !isNaN(new Date(s).getTime()), {
  message: "Data inválida — use formato ISO 8601",
});

const publicarSchema = z.object({
  tipoProfissional: z.enum(TIPOS_PROFISSIONAL).default("MEDICO"),
  especialidade: z.string().min(2).max(100),
  dataInicio: isoDateString,
  dataFim: isoDateString,
  valorKwanzas: z.number().int().min(500).max(5_000_000),
  vagas: z.number().int().min(1).max(50),
  descricao: z.string().max(2000).optional(),
  metodo: z.enum(METODOS_PAGAMENTO).default("TRANSFERENCIA_BANCARIA"),
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
  if (!session || session.role !== "MEDICO") {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const prof = await getProfissionalFromSession(session);
  if (!prof) return Response.json({ error: "Profissional não encontrado" }, { status: 404 });

  const plantoes = await prisma.plantao.findMany({
    where: { profissionalPublicadorId: prof.id },
    include: {
      _count: { select: { candidaturas: true } },
      pagamentos: { select: { id: true }, take: 1 },
    },
    orderBy: { dataInicio: "desc" },
  });

  return Response.json(
    plantoes.map((p) => ({
      id: p.id,
      especialidade: p.especialidade,
      tipoProfissional: p.tipoProfissional,
      dataInicio: p.dataInicio.toISOString(),
      dataFim: p.dataFim.toISOString(),
      valorKwanzas: p.valorKwanzas,
      vagas: p.vagas,
      vagasPreenchidas: p.vagasPreenchidas,
      estado: p.estado,
      descricao: p.descricao,
      candidaturas: p._count.candidaturas,
      pagamentoId: p.pagamentos[0]?.id ?? null,
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.role !== "MEDICO") {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const prof = await getProfissionalFromSession(session);
  if (!prof) return Response.json({ error: "Profissional não encontrado" }, { status: 404 });

  let rawBody: unknown;
  try { rawBody = await request.json(); } catch { return Response.json({ error: "Body inválido" }, { status: 400 }); }
  const parsed = publicarSchema.safeParse(rawBody);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });

  const {
    tipoProfissional, especialidade, dataInicio, dataFim,
    valorKwanzas, vagas, descricao, metodo,
    maca, estetoscopio, tensiometro, termometro, computador,
    materiaisBasicos, nebulizador, oximetro, glucometro, desfibrilador,
  } = parsed.data;

  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  if (fim <= inicio) return Response.json({ error: "dataFim deve ser posterior a dataInicio" }, { status: 400 });
  if (inicio < new Date()) return Response.json({ error: "Não é possível publicar plantões no passado" }, { status: 400 });

  const comissao = Math.round(valorKwanzas * 0.10);

  const { plantao, pagamento } = await prisma.$transaction(async (tx) => {
    const p = await tx.plantao.create({
      data: {
        profissionalPublicadorId: prof.id,
        publicadoPorMedico: true,
        tipoProfissional,
        especialidade,
        dataInicio: inicio,
        dataFim: fim,
        valorKwanzas,
        valorCentavos: BigInt(valorKwanzas) * 100n,
        vagas,
        descricao: descricao ?? null,
        estado: "AGUARDANDO_PAGAMENTO",
        maca, estetoscopio, tensiometro, termometro, computador,
        materiaisBasicos, nebulizador, oximetro, glucometro, desfibrilador,
      },
    });
    const pag = await tx.pagamento.create({
      data: {
        tipo: "TURNO",
        plantaoId: p.id,
        valorBrutoAoa: valorKwanzas,
        comissaoAoa: comissao,
        valorLiquidoAoa: valorKwanzas - comissao,
        metodo,
        estado: "PENDENTE",
      },
    });
    return { plantao: p, pagamento: pag };
  });

  return Response.json({ id: plantao.id, pagamentoId: pagamento.id, valorKwanzas, metodo }, { status: 201 });
}
