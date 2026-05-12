import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/api-auth";
import type { TipoProfissional } from "@/generated/prisma/enums";
import { z } from "zod";

const TIPOS_PROFISSIONAL_VALIDOS = ["MEDICO", "ENFERMEIRO", "TECNICO_SAUDE", "OUTRO"] as const;

const isoDateString = z.string().refine((s) => !isNaN(new Date(s).getTime()), {
  message: "Data inválida — use formato ISO 8601",
});

const criarPlantaoSchema = z.object({
  tipoProfissional: z.enum(TIPOS_PROFISSIONAL_VALIDOS).default("MEDICO"),
  especialidade: z.string().min(2).max(100),
  dataInicio: isoDateString,
  dataFim: isoDateString,
  valorKwanzas: z.number().int().min(500).max(5_000_000),
  vagas: z.number().int().min(1).max(50),
  descricao: z.string().max(2000).optional(),
  salaId: z.string().optional().nullable(),
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

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const especialidade = searchParams.get("especialidade");
  const zona = searchParams.get("zona");
  const valorMax = searchParams.get("valorMax");
  const valorMin = searchParams.get("valorMin");
  const tipoProfissional = searchParams.get("tipoProfissional");
  const disponivelAgora = searchParams.get("disponivelAgora") === "true";
  const pagina = Math.max(1, parseInt(searchParams.get("pagina") ?? "1", 10));

  const agora = new Date();

  // If logged in as MEDICO, exclude their own published plantões
  let excluirProfissionalId: string | undefined;
  const session = await getAuthSession();
  if (session?.role === "MEDICO") {
    const prof = await prisma.profissional.findUnique({
      where: { userId: session.id },
      select: { id: true },
    });
    if (prof) excluirProfissionalId = prof.id;
  }

  const where = {
    estado: "ABERTO" as const,
    // Exclude the doctor's own published shifts, but keep clinica-published ones (profissionalPublicadorId = null)
    ...(excluirProfissionalId
      ? { OR: [{ profissionalPublicadorId: null }, { profissionalPublicadorId: { not: excluirProfissionalId } }] }
      : {}),
    ...(especialidade && { especialidade }),
    ...(tipoProfissional && { tipoProfissional: tipoProfissional as TipoProfissional }),
    ...(zona && { clinica: { cidade: { contains: zona, mode: "insensitive" as const } } }),
    ...(valorMax || valorMin
      ? {
          valorKwanzas: {
            ...(valorMax && { lte: parseInt(valorMax) }),
            ...(valorMin && { gte: parseInt(valorMin) }),
          },
        }
      : {}),
    ...(disponivelAgora && {
      dataInicio: {
        gte: agora,
        lte: new Date(agora.getTime() + 4 * 60 * 60 * 1000),
      },
    }),
  };

  const [plantoes, total] = await prisma.$transaction([
    prisma.plantao.findMany({
      where,
      include: {
        clinica: true,
        profissionalPublicador: true,
        _count: { select: { candidaturas: true } },
      },
      orderBy: { dataInicio: "asc" },
      skip: (pagina - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.plantao.count({ where }),
  ]);

  return Response.json({
    plantoes: plantoes.map((p) => ({
      id: p.id,
      publicadoPorMedico: p.publicadoPorMedico,
      clinica: p.clinica
        ? {
            id: p.clinica.id,
            nome: p.clinica.nome,
            morada: p.clinica.morada,
            cidade: p.clinica.cidade,
            provincia: p.clinica.provincia,
            logo: p.clinica.logo ?? "",
            rating: p.clinica.rating,
            totalAvaliacoes: p.clinica.totalAvaliacoes,
            verified: p.clinica.verified,
          }
        : null,
      profissionalPublicador: p.profissionalPublicador
        ? {
            id: p.profissionalPublicador.id,
            nome: p.profissionalPublicador.nome,
            especialidade: p.profissionalPublicador.especialidade,
            rating: p.profissionalPublicador.rating,
            verified: p.profissionalPublicador.verified,
          }
        : null,
      tipoProfissional: p.tipoProfissional,
      especialidade: p.especialidade,
      dataInicio: p.dataInicio.toISOString(),
      dataFim: p.dataFim.toISOString(),
      valorKwanzas: p.valorKwanzas,
      vagas: p.vagas,
      vagasPreenchidas: p.vagasPreenchidas,
      estado: p.estado,
      descricao: p.descricao ?? "",
      candidatos: p._count.candidaturas,
      equipamentos: {
        maca: p.maca,
        estetoscopio: p.estetoscopio,
        tensiometro: p.tensiometro,
        termometro: p.termometro,
        computador: p.computador,
        materiaisBasicos: p.materiaisBasicos,
        nebulizador: p.nebulizador,
        oximetro: p.oximetro,
        glucometro: p.glucometro,
        desfibrilador: p.desfibrilador,
      },
    })),
    paginacao: {
      pagina,
      porPagina: PAGE_SIZE,
      total,
      totalPaginas: Math.ceil(total / PAGE_SIZE),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.role !== "CLINICA") {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const clinica = await prisma.clinica.findUnique({ where: { userId: session.id } });
  if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

  let rawBody: unknown;
  try { rawBody = await request.json(); } catch { return Response.json({ error: "Body inválido" }, { status: 400 }); }

  const parsed = criarPlantaoSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const {
    tipoProfissional, especialidade, dataInicio, dataFim,
    valorKwanzas, vagas, descricao, salaId,
    maca, estetoscopio, tensiometro, termometro, computador,
    materiaisBasicos, nebulizador, oximetro, glucometro, desfibrilador,
  } = parsed.data;

  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  if (fim <= inicio) {
    return Response.json({ error: "dataFim deve ser posterior a dataInicio" }, { status: 400 });
  }
  if (inicio < new Date()) {
    return Response.json({ error: "Não é possível publicar plantões no passado" }, { status: 400 });
  }

  const comissao = Math.round(valorKwanzas * 0.10);

  const { plantao, pagamento } = await prisma.$transaction(async (tx) => {
    const p = await tx.plantao.create({
      data: {
        clinicaId: clinica.id,
        tipoProfissional,
        especialidade,
        dataInicio: inicio,
        dataFim: fim,
        valorKwanzas,
        valorCentavos: BigInt(valorKwanzas) * 100n,
        vagas,
        descricao: descricao ?? null,
        salaId: salaId ?? null,
        estado: "AGUARDANDO_PAGAMENTO",
        maca,
        estetoscopio,
        tensiometro,
        termometro,
        computador,
        materiaisBasicos,
        nebulizador,
        oximetro,
        glucometro,
        desfibrilador,
      },
    });
    const pag = await tx.pagamento.create({
      data: {
        tipo: "TURNO",
        plantaoId: p.id,
        valorBrutoAoa: valorKwanzas,
        comissaoAoa: comissao,
        valorLiquidoAoa: valorKwanzas - comissao,
        metodo: "TRANSFERENCIA_BANCARIA",
        estado: "PENDENTE",
      },
    });
    return { plantao: p, pagamento: pag };
  });

  return Response.json({ id: plantao.id, pagamentoId: pagamento.id, valorKwanzas }, { status: 201 });
}
