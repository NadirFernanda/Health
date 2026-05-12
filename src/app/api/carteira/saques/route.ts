import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const saqueSchema = z.object({
  valor: z.number().int().min(1000).max(10_000_000),
  dadosBancarios: z.object({
    banco: z.string().min(2).max(100),
    titular: z.string().min(2).max(150),
    iban: z.string().min(15).max(34).regex(/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/, "IBAN inválido"),
    telefone: z.string().max(20).optional(),
  }),
});

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const prof = await prisma.profissional.findUnique({
    where: { userId: session.id },
    select: { id: true, saldoCarteira: true, saldoCarteiraCentavos: true },
  });
  if (!prof) return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Body inválido" }, { status: 400 }); }

  const parsed = saqueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }
  const { valor, dadosBancarios } = parsed.data;

  // Use integer centavos throughout to avoid float precision issues
  const valorCentavos = BigInt(valor) * 100n;

  try {
    const saque = await prisma.$transaction(async (tx) => {
      // Re-fetch balance inside transaction to prevent TOCTOU race condition
      const profFresh = await tx.profissional.findUnique({
        where: { id: prof.id },
        select: { saldoCarteiraCentavos: true, saldoCarteira: true },
      });

      const currentCentavos = profFresh?.saldoCarteiraCentavos ?? 0n;
      if (currentCentavos < valorCentavos) {
        throw new Error("SALDO_INSUFICIENTE");
      }

      // Check for existing pending saque INSIDE the transaction to avoid race
      const jaPendente = await tx.pedidoSaque.findFirst({
        where: { profissionalId: prof.id, estado: "PENDENTE" },
      });
      if (jaPendente) throw new Error("JA_PENDENTE");

      const newCentavos = currentCentavos - valorCentavos;
      const newAoa = Number(newCentavos) / 100;

      await tx.profissional.update({
        where: { id: prof.id },
        data: { saldoCarteiraCentavos: newCentavos, saldoCarteira: newAoa },
      });

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
          valorAoa: valor,
          valorCentavos,
          dadosBancarios,
        },
      });
    });

    return NextResponse.json({ id: saque.id, estado: saque.estado }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "SALDO_INSUFICIENTE")
        return NextResponse.json({ error: "Saldo insuficiente" }, { status: 422 });
      if (err.message === "JA_PENDENTE")
        return NextResponse.json({ error: "Já tens um pedido de levantamento pendente" }, { status: 409 });
    }
    console.error("[saques]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
