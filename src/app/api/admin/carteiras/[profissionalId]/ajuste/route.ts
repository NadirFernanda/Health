import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { checkModuleAccess } from "@/lib/admin-permissions";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ profissionalId: string }> }
) {
  const session = await getAuthSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const canAccess = await checkModuleAccess(session.id, (session as { adminRole?: string | null }).adminRole ?? null, "financeiro", "write");
  if (!canAccess) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { profissionalId } = await params;
  const body = await request.json() as { tipo: "CREDITO" | "DEBITO"; valor: number; motivo: string };

  if (!["CREDITO", "DEBITO"].includes(body.tipo)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (!body.valor || body.valor <= 0) {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }
  if (!body.motivo?.trim()) {
    return NextResponse.json({ error: "Motivo obrigatório" }, { status: 400 });
  }

  const prof = await prisma.profissional.findUnique({
    where: { id: profissionalId },
    select: { id: true, saldoCarteira: true, saldoCarteiraCentavos: true },
  });
  if (!prof) return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });

  const valorCentavos = BigInt(Math.round(body.valor * 100));
  const currentCentavos = prof.saldoCarteiraCentavos ?? 0n;

  if (body.tipo === "DEBITO") {
    const saldoAtual = Number(currentCentavos) > 0
      ? Number(currentCentavos) / 100
      : (prof.saldoCarteira ?? 0);
    if (body.valor > saldoAtual) {
      return NextResponse.json({ error: "Saldo insuficiente para débito" }, { status: 422 });
    }
  }

  await prisma.$transaction(async (tx) => {
    const delta = body.tipo === "CREDITO" ? valorCentavos : -valorCentavos;
    const newCentavos = BigInt(Math.max(0, Number(currentCentavos) + Number(delta)));
    const deltaKwanzas = body.tipo === "CREDITO" ? body.valor : -body.valor;

    await tx.profissional.update({
      where: { id: profissionalId },
      data: {
        saldoCarteiraCentavos: newCentavos,
        saldoCarteira: Math.max(0, (prof.saldoCarteira ?? 0) + deltaKwanzas),
      },
    });

    await tx.transacaoCarteira.create({
      data: {
        profissionalId,
        tipo: body.tipo,
        descricao: `Ajuste admin: ${body.motivo}`,
        estado: "PROCESSADO",
        valorCentavos,
        referencia: `ADM-${session.id.slice(-6).toUpperCase()}-${Date.now()}`,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
