import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/api-auth";

const MAX_SUGESTOES = 10;

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.role !== "MEDICO") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const prof = await prisma.profissional.findUnique({
    where: { userId: session.id },
    select: { id: true, especialidade: true, cidade: true },
  });
  if (!prof) return NextResponse.json({ sugestoes: [] });

  const agora = new Date();

  // Base filter: open shifts in the future
  const baseWhere = {
    estado: "ABERTO" as const,
    dataInicio: { gte: agora },
    // exclude own published shifts
    OR: [
      { profissionalPublicadorId: null },
      { profissionalPublicadorId: { not: prof.id } },
    ],
  };

  // Tier 1: same specialty + same zone
  // Tier 2: same specialty only
  // Tier 3: any open shift
  const [tier1, tier2, tier3] = await Promise.all([
    prof.cidade
      ? prisma.plantao.findMany({
          where: {
            ...baseWhere,
            especialidade: prof.especialidade,
            clinica: { cidade: { contains: prof.cidade, mode: "insensitive" } },
          },
          include: { clinica: true, profissionalPublicador: true },
          orderBy: { dataInicio: "asc" },
          take: MAX_SUGESTOES,
        })
      : [],
    prisma.plantao.findMany({
      where: { ...baseWhere, especialidade: prof.especialidade },
      include: { clinica: true, profissionalPublicador: true },
      orderBy: { dataInicio: "asc" },
      take: MAX_SUGESTOES,
    }),
    prisma.plantao.findMany({
      where: baseWhere,
      include: { clinica: true, profissionalPublicador: true },
      orderBy: { dataInicio: "asc" },
      take: MAX_SUGESTOES,
    }),
  ]);

  // Merge tiers without duplicates, preserving relevance order
  const seen = new Set<string>();
  const merged = [...tier1, ...tier2, ...tier3].filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  const sugestoes = merged.slice(0, MAX_SUGESTOES).map((p) => ({
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
    // Why it was suggested
    motivo:
      tier1.some((t) => t.id === p.id)
        ? "zona_especialidade"
        : tier2.some((t) => t.id === p.id)
        ? "especialidade"
        : "aberto",
  }));

  return NextResponse.json({ sugestoes, perfil: { especialidade: prof.especialidade, zona: prof.cidade } });
}
