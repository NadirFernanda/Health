import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const auth = await requireSession("ADMIN");
    if (auth instanceof Response) {
      console.warn("[GET /api/admin/transacoes] Falha de autenticação");
      return auth;
    }

    console.log("[GET /api/admin/transacoes] Autenticado como ADMIN");

    const transacoes = await prisma.pagamento.findMany({
      orderBy: { criadoEm: "desc" },
      take: 100,
      include: {
        beneficiario: { select: { nome: true } },
        plantao: { select: { especialidade: true } },
        candidatura: { select: { id: true } },
      },
    });

    console.log(`[GET /api/admin/transacoes] Encontradas ${transacoes.length} transações`);

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
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[GET /api/admin/transacoes] Erro interno:", { errorMsg, stack });
    return Response.json(
      { error: "Falha interna ao carregar transações.", details: errorMsg },
      { status: 500 }
    );
  }
}
