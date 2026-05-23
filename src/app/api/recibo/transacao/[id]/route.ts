import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

function buildNumero(id: string, criadoEm: Date) {
  return `MF-TC-${criadoEm.getFullYear()}-${id.slice(-8).toUpperCase()}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const transacao = await prisma.transacaoCarteira.findUnique({
    where: { id },
    include: { profissional: { select: { userId: true, nome: true } } },
  });

  if (!transacao) return Response.json({ error: "Não encontrado" }, { status: 404 });

  const autorizado =
    session.role === "ADMIN" ||
    transacao.profissional.userId === session.id;

  if (!autorizado) return Response.json({ error: "Sem permissão" }, { status: 403 });

  const valorAoa = Number(transacao.valorCentavos) / 100;

  return Response.json({
    numero: buildNumero(transacao.id, transacao.criadoEm),
    pagoEm: transacao.criadoEm.toISOString(),
    metodo: transacao.tipo === "CREDITO" ? "CREDITO" : "DEBITO",
    valor: valorAoa,
    comissao: 0,
    estado: transacao.estado,
    subTipo: "TRANSACAO_CARTEIRA",
    descricao: transacao.descricao,
    pagador: transacao.profissional.nome,
    referencia: (transacao.referencia ?? transacao.id).slice(-12).toUpperCase(),
  });
}
