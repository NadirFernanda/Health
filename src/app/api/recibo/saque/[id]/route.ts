import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

type DadosBancarios = { banco: string; titular: string; iban: string };

function buildNumero(id: string, criadoEm: Date) {
  return `MF-LV-${criadoEm.getFullYear()}-${id.slice(-8).toUpperCase()}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const saque = await prisma.pedidoSaque.findUnique({
    where: { id },
    include: { profissional: { select: { userId: true, nome: true } } },
  });

  if (!saque) return Response.json({ error: "Não encontrado" }, { status: 404 });

  const autorizado =
    session.role === "ADMIN" ||
    saque.profissional.userId === session.id;

  if (!autorizado) return Response.json({ error: "Sem permissão" }, { status: 403 });

  const db = saque.dadosBancarios as DadosBancarios;

  return Response.json({
    numero: buildNumero(saque.id, saque.criadoEm),
    pagoEm: (saque.processadoEm ?? saque.criadoEm).toISOString(),
    metodo: "TRANSFERENCIA_BANCARIA",
    valor: saque.valorAoa,
    comissao: 0,
    estado: saque.estado,
    subTipo: "LEVANTAMENTO",
    descricao: `Levantamento para ${db.banco}`,
    pagador: saque.profissional.nome,
    referencia: saque.id.slice(-12).toUpperCase(),
    dadosBancarios: db,
    motivoRejeicao: saque.motivoRejeicao ?? undefined,
  });
}
