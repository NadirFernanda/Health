import { requireSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;
  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  const transacoes = await prisma.transacaoCarteira.findMany({
    where: { profissionalId: prof.id },
    orderBy: { criadoEm: "desc" },
  });

  return Response.json({
    saldo: prof.saldoCarteira,
    saldoCentavos: prof.saldoCarteiraCentavos.toString(),
    totalPlantoes: prof.totalPlantoes,
    transacoes: transacoes.map((t) => ({
      id: t.id,
      tipo: t.tipo,
      valorCentavos: t.valorCentavos.toString(),
      descricao: t.descricao,
      referencia: t.referencia ?? null,
      data: t.criadoEm.toISOString(),
      estado: t.estado,
    })),
  });
}
