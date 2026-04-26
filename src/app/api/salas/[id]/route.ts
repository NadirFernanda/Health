import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const s = await prisma.sala.findUnique({
    where: { id },
    include: { clinica: true },
  });

  if (!s) return Response.json({ error: "Não encontrado" }, { status: 404 });

  return Response.json({
    id: s.id,
    nome: s.nome,
    tipo: s.tipo,
    precoPorHora: s.precoPorHora,
    precoPorHoraCentavos: s.precoPorHoraCentavos?.toString() ?? null,
    zona: s.zona,
    descricao: s.descricao ?? "",
    disponivel: s.disponivel,
    avaliacaoMedia: s.avaliacaoMedia,
    totalAvaliacoes: s.totalAvaliacoes,
    clinica: {
      id: s.clinica.id,
      nome: s.clinica.nome,
      cidade: s.clinica.cidade,
      morada: s.clinica.morada,
      verified: s.clinica.verified,
      rating: s.clinica.rating,
    },
    equipamentos: {
      maca: s.maca, estetoscopio: s.estetoscopio, tensiometro: s.tensiometro,
      termometro: s.termometro, computador: s.computador, materiaisBasicos: s.materiaisBasicos,
      nebulizador: s.nebulizador, oximetro: s.oximetro, glucometro: s.glucometro, desfibrilador: s.desfibrilador,
    },
  });
}
