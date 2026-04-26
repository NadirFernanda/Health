import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const especialidade = searchParams.get("especialidade");
  const zona = searchParams.get("zona");
  const valorMax = searchParams.get("valorMax");
  const tipoProfissional = searchParams.get("tipoProfissional");
  const disponivelAgora = searchParams.get("disponivelAgora") === "true";

  const agora = new Date();

  const plantoes = await prisma.plantao.findMany({
    where: {
      estado: "ABERTO",
      ...(especialidade && { especialidade }),
      ...(tipoProfissional && { tipoProfissional: tipoProfissional as import("@/generated/prisma").TipoProfissional }),
      ...(zona && { clinica: { cidade: { contains: zona } } }),
      ...(valorMax && { valorKwanzas: { lte: parseInt(valorMax) } }),
      ...(disponivelAgora && {
        dataInicio: {
          gte: agora,
          lte: new Date(agora.getTime() + 4 * 60 * 60 * 1000),
        },
      }),
    },
    include: {
      clinica: true,
      _count: { select: { candidaturas: true } },
    },
    orderBy: { dataInicio: "asc" },
  });

  return Response.json(
    plantoes.map((p) => ({
      id: p.id,
      clinica: {
        id: p.clinica.id,
        nome: p.clinica.nome,
        morada: p.clinica.morada,
        cidade: p.clinica.cidade,
        provincia: p.clinica.provincia,
        logo: p.clinica.logo ?? "",
        rating: p.clinica.rating,
        totalAvaliacoes: p.clinica.totalAvaliacoes,
        verified: p.clinica.verified,
      },
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
        maca: p.maca, estetoscopio: p.estetoscopio, tensiometro: p.tensiometro,
        termometro: p.termometro, computador: p.computador, materiaisBasicos: p.materiaisBasicos,
        nebulizador: p.nebulizador, oximetro: p.oximetro, glucometro: p.glucometro, desfibrilador: p.desfibrilador,
      },
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "CLINICA") {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const clinica = await prisma.clinica.findUnique({ where: { userId: session.userId } });
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

  const plantao = await prisma.plantao.create({
    data: {
      clinicaId: clinica.id,
      tipoProfissional: tipoProfissional ?? "MEDICO",
      especialidade,
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim),
      valorKwanzas: parseInt(valorKwanzas),
      valorCentavos: BigInt(parseInt(valorKwanzas)) * 100n,
      vagas: parseInt(vagas),
      descricao: descricao ?? null,
      salaId: salaId ?? null,
      maca: maca ?? false, estetoscopio: estetoscopio ?? false,
      tensiometro: tensiometro ?? false, termometro: termometro ?? false,
      computador: computador ?? false, materiaisBasicos: materiaisBasicos ?? true,
      nebulizador: nebulizador ?? false, oximetro: oximetro ?? false,
      glucometro: glucometro ?? false, desfibrilador: desfibrilador ?? false,
    },
  });

  return Response.json({ id: plantao.id }, { status: 201 });
}
