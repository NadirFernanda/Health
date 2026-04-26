import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const p = await prisma.plantao.findUnique({
    where: { id },
    include: {
      clinica: true,
      profissionalPublicador: true,
      _count: { select: { candidaturas: true } },
    },
  });

  if (!p) return Response.json({ error: "Não encontrado" }, { status: 404 });

  return Response.json({
    id: p.id,
    publicadoPorMedico: p.publicadoPorMedico,
    clinica: p.clinica ? {
      id: p.clinica.id,
      nome: p.clinica.nome,
      morada: p.clinica.morada,
      cidade: p.clinica.cidade,
      provincia: p.clinica.provincia,
      logo: p.clinica.logo ?? "",
      rating: p.clinica.rating,
      totalAvaliacoes: p.clinica.totalAvaliacoes,
      verified: p.clinica.verified,
    } : null,
    profissionalPublicador: p.profissionalPublicador ? {
      id: p.profissionalPublicador.id,
      nome: p.profissionalPublicador.nome,
      especialidade: p.profissionalPublicador.especialidade,
      rating: p.profissionalPublicador.rating,
      verified: p.profissionalPublicador.verified,
    } : null,
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
  });
}
