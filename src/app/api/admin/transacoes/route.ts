import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireSession("ADMIN");
  if (auth instanceof Response) return auth;

  const transacoes = await prisma.pagamento.findMany({
    orderBy: { criadoEm: "desc" },
    take: 100,
    include: {
      beneficiario: { select: { nome: true } },
      plantao: { select: { especialidade: true } },
      candidatura: { select: { id: true } },
    },
  });

  return Response.json(
    transacoes.map((t) => ({
      id: t.id,
      tipo: t.tipo,
      descricao: t.beneficiario
        ? `Pagamento — ${t.beneficiario.nome}`
        : t.plantao
        ? `Plantão — ${t.plantao.especialidade}`
        : "Transação",
      valorBruto: t.valorBrutoAoa,
      comissao: t.comissaoAoa,
      valorLiquido: t.valorLiquidoAoa,
      estado: t.estado,
      metodo: t.metodo,
      data: t.criadoEm.toISOString(),
      beneficiario: t.beneficiario?.nome ?? null,
    }))
  );
}
