import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const especialidade = searchParams.get("especialidade");
  const zona = searchParams.get("zona");
  const valorMax = searchParams.get("valorMax");
  const disponivelAgora = searchParams.get("disponivelAgora") === "true";

  const agora = new Date();

  const plantoes = await prisma.plantao.findMany({
    where: {
      estado: "ABERTO",
      ...(especialidade && { especialidade }),
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
