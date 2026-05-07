import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

type DadosBancarios = {
  banco: string;
  titular: string;
  iban: string;
  telefone?: string;
};

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const prof = await prisma.profissional.findUnique({
    where: { userId: session.id },
    select: { id: true, saldoCarteira: true, saldoCarteiraCentavos: true },
  });
  if (!prof) return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });

  const body = await request.json() as { valor: number; dadosBancarios: DadosBancarios };
  const { valor, dadosBancarios } = body;

  if (!valor || valor < 1000) {
    return NextResponse.json({ error: "Valor mínimo de levantamento é 1.000 AOA" }, { status: 400 });
  }
  if (!dadosBancarios?.banco || !dadosBancarios?.titular || !dadosBancarios?.iban) {
    return NextResponse.json({ error: "Dados bancários incompletos" }, { status: 400 });
  }

  const saldoCentavos = Number(prof.saldoCarteiraCentavos ?? 0n);
  const saldoAoa = saldoCentavos > 0 ? saldoCentavos / 100 : (prof.saldoCarteira ?? 0);

  if (valor > saldoAoa) {
    return NextResponse.json({ error: "Saldo insuficiente" }, { status: 422 });
  }

  // Check for existing pending saque
  const jaPendente = await prisma.pedidoSaque.findFirst({
    where: { profissionalId: prof.id, estado: "PENDENTE" },
  });
  if (jaPendente) {
    return NextResponse.json({ error: "Já tens um pedido de levantamento pendente" }, { status: 409 });
  }

  const valorCentavos = BigInt(Math.round(valor * 100));

  const saque = await prisma.$transaction(async (tx) => {
    // Deduct balance immediately (held in escrow until admin approves)
    const newCentavos = BigInt(Math.max(0, Number(prof.saldoCarteiraCentavos ?? 0n) - Number(valorCentavos)));
    await tx.profissional.update({
      where: { id: prof.id },
      data: {
        saldoCarteiraCentavos: newCentavos,
        saldoCarteira: Math.max(0, (prof.saldoCarteira ?? 0) - valor),
      },
    });

    // Record debit transaction
    await tx.transacaoCarteira.create({
      data: {
        profissionalId: prof.id,
        tipo: "DEBITO",
        descricao: `Pedido de levantamento — ${dadosBancarios.banco}`,
        estado: "PENDENTE",
        valorCentavos,
        referencia: `SAQUE-${Date.now()}`,
      },
    });

    return tx.pedidoSaque.create({
      data: {
        profissionalId: prof.id,
        valorAoa: Math.round(valor),
        valorCentavos,
        dadosBancarios,
      },
    });
  });

  return NextResponse.json({ id: saque.id, estado: saque.estado }, { status: 201 });
}
