import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { checkModuleAccess } from "@/lib/admin-permissions";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const canAccess = await checkModuleAccess(session.id, (session as { adminRole?: string | null }).adminRole ?? null, "financeiro", "write");
  if (!canAccess) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const body = await request.json() as { acao: "APROVAR" | "REJEITAR"; motivo?: string };

  if (!["APROVAR", "REJEITAR"].includes(body.acao)) {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }
  if (body.acao === "REJEITAR" && !body.motivo?.trim()) {
    return NextResponse.json({ error: "Motivo de rejeição obrigatório" }, { status: 400 });
  }

  const saque = await prisma.pedidoSaque.findUnique({
    where: { id },
    include: {
      profissional: { select: { id: true, saldoCarteira: true, saldoCarteiraCentavos: true } },
    },
  });
  if (!saque) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (saque.estado !== "PENDENTE") {
    return NextResponse.json({ error: "Pedido já processado" }, { status: 409 });
  }

  if (body.acao === "APROVAR") {
    // Mark the debit transaction as PROCESSADO (already deducted at request time)
    await prisma.$transaction(async (tx) => {
      await tx.pedidoSaque.update({
        where: { id },
        data: { estado: "APROVADO", adminId: session.id, processadoEm: new Date() },
      });
      // Update matching pending debit transaction
      const transacao = await tx.transacaoCarteira.findFirst({
        where: {
          profissionalId: saque.profissionalId,
          tipo: "DEBITO",
          estado: "PENDENTE",
          valorCentavos: saque.valorCentavos,
        },
        orderBy: { criadoEm: "desc" },
      });
      if (transacao) {
        await tx.transacaoCarteira.update({
          where: { id: transacao.id },
          data: { estado: "PROCESSADO" },
        });
      }
    });
  } else {
    // REJEITAR — refund the deducted balance
    await prisma.$transaction(async (tx) => {
      const prof = saque.profissional;
      const currentCentavos = prof.saldoCarteiraCentavos ?? 0n;
      const newCentavos = BigInt(Number(currentCentavos) + Number(saque.valorCentavos));

      await tx.profissional.update({
        where: { id: saque.profissionalId },
        data: {
          saldoCarteiraCentavos: newCentavos,
          saldoCarteira: (prof.saldoCarteira ?? 0) + saque.valorAoa,
        },
      });

      await tx.pedidoSaque.update({
        where: { id },
        data: { estado: "REJEITADO", adminId: session.id, motivoRejeicao: body.motivo, processadoEm: new Date() },
      });

      // Refund credit transaction
      await tx.transacaoCarteira.create({
        data: {
          profissionalId: saque.profissionalId,
          tipo: "CREDITO",
          descricao: `Levantamento rejeitado — devolvido: ${body.motivo}`,
          estado: "PROCESSADO",
          valorCentavos: saque.valorCentavos,
          referencia: `REF-SAQUE-${id.slice(-8).toUpperCase()}`,
        },
      });

      // Cancel the original pending debit
      const transacao = await tx.transacaoCarteira.findFirst({
        where: {
          profissionalId: saque.profissionalId,
          tipo: "DEBITO",
          estado: "PENDENTE",
          valorCentavos: saque.valorCentavos,
        },
        orderBy: { criadoEm: "desc" },
      });
      if (transacao) {
        await tx.transacaoCarteira.update({
          where: { id: transacao.id },
          data: { estado: "REEMBOLSADO" },
        });
      }
    });
  }

  await createAuditLog("admin_saque", {
    entity: "PedidoSaque",
    entityId: id,
    acao: body.acao,
    valorAoa: saque.valorAoa,
    motivo: body.motivo ?? null,
  }, session.id);

  return NextResponse.json({ ok: true });
}
