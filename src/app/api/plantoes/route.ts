import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/api-auth";
import type { TipoProfissional } from "@/generated/prisma/enums";

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

  const body = await request.json();
  const {
    tipoProfissional, especialidade, dataInicio, dataFim,
    valorKwanzas, vagas, descricao, salaId,
    maca, estetoscopio, tensiometro, termometro, computador,
    materiaisBasicos, nebulizador, oximetro, glucometro, desfibrilador,
  } = body;

  if (!especialidade || !dataInicio || !dataFim || !valorKwanzas || !vagas) {
    return Response.json({ error: "Campos obrigatórios em falta" }, { status: 400 });
  }

  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  if (isNaN(inicio.getTime()) || isNaN(fim.getTime()) || fim <= inicio) {
    return Response.json({ error: "Datas inválidas" }, { status: 400 });
  }

  const plantao = await prisma.plantao.create({
    data: {
      clinicaId: clinica.id,
      tipoProfissional: tipoProfissional ?? "MEDICO",
      especialidade,
      dataInicio: inicio,
      dataFim: fim,
      valorKwanzas: parseInt(valorKwanzas),
      valorCentavos: BigInt(parseInt(valorKwanzas)) * 100n,
      vagas: parseInt(vagas),
      descricao: descricao ?? null,
      salaId: salaId ?? null,
      maca: maca ?? false,
      estetoscopio: estetoscopio ?? false,
      tensiometro: tensiometro ?? false,
      termometro: termometro ?? false,
      computador: computador ?? false,
      materiaisBasicos: materiaisBasicos ?? true,
      nebulizador: nebulizador ?? false,
      oximetro: oximetro ?? false,
      glucometro: glucometro ?? false,
      desfibrilador: desfibrilador ?? false,
    },
  });

  return Response.json({ id: plantao.id }, { status: 201 });
}
