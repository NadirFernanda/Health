import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession, getProfissionalFromSession } from "@/lib/api-auth";

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.role !== "MEDICO") {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const prof = await getProfissionalFromSession(session);
  if (!prof) return Response.json({ error: "Profissional não encontrado" }, { status: 404 });

  const plantoes = await prisma.plantao.findMany({
    where: { profissionalPublicadorId: prof.id },
    include: { _count: { select: { candidaturas: true } } },
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

  const body = await request.json();
  const {
    tipoProfissional, especialidade, dataInicio, dataFim,
    valorKwanzas, vagas, descricao,
    maca, estetoscopio, tensiometro, termometro, computador,
    materiaisBasicos, nebulizador, oximetro, glucometro, desfibrilador,
  } = body;

  if (!especialidade || !dataInicio || !dataFim || !valorKwanzas || !vagas) {
    return Response.json({ error: "Campos obrigatórios em falta" }, { status: 400 });
  }

  const plantao = await prisma.plantao.create({
    data: {
      profissionalPublicadorId: prof.id,
      publicadoPorMedico: true,
      tipoProfissional: tipoProfissional ?? "MEDICO",
      especialidade,
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim),
      valorKwanzas: parseInt(valorKwanzas),
      valorCentavos: BigInt(parseInt(valorKwanzas)) * 100n,
      vagas: parseInt(vagas),
      descricao: descricao ?? null,
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
