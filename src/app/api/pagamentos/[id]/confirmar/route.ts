import { NextRequest } from "next/server";
import { getAuthSession, getProfissionalFromSession, getClinicaFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { executarConfirmacao } from "@/lib/confirmar-pagamento";

type MetodoSimulado = "MULTICAIXA_EXPRESS" | "TPA";

type GatewayInput = {
  metodo: MetodoSimulado;
  telefone?: string;   // MULTICAIXA_EXPRESS
  cartao?: string;     // TPA — número do cartão (fake)
  expiracao?: string;  // TPA — MM/AA
  cvv?: string;        // TPA
};

type GatewayResult = { sucesso: boolean; codigo: string; mensagem: string };

function simularGateway(input: GatewayInput, valor: number): GatewayResult {
  const { metodo, telefone = "", cartao = "" } = input;

  // Modo de teste: usar "FALHAR" força falha
  const forceFailure =
    telefone.toUpperCase().includes("FALHAR") ||
    cartao.replace(/\s/g, "").startsWith("0000");

  if (forceFailure) {
    return { sucesso: false, codigo: "TEST_DECLINED", mensagem: "Pagamento recusado (modo de teste — use 'FALHAR' para forçar erro)" };
  }

  if (metodo === "MULTICAIXA_EXPRESS") {
    const cleaned = telefone.replace(/[\s\-]/g, "");
    if (!/^9\d{8}$/.test(cleaned)) {
      return { sucesso: false, codigo: "INVALID_PHONE", mensagem: "Número inválido. Use 9 dígitos começando por 9 (ex: 923456789)" };
    }
    return { sucesso: true, codigo: "MCX_APPROVED", mensagem: `Debitado ${valor.toLocaleString()} AOA do número ${cleaned}` };
  }

  if (metodo === "TPA") {
    const numLimpo = cartao.replace(/\s/g, "");
    if (!/^\d{16}$/.test(numLimpo)) {
      return { sucesso: false, codigo: "INVALID_CARD", mensagem: "Número de cartão inválido (16 dígitos necessários)" };
    }
    return { sucesso: true, codigo: "TPA_APPROVED", mensagem: `Cartão terminado em ${numLimpo.slice(-4)} aprovado` };
  }

  return { sucesso: false, codigo: "UNSUPPORTED", mensagem: "Método não suportado para pagamento simulado" };
}

async function verificarPropriedade(pagamentoId: string, session: { id: string; role: string }): Promise<boolean> {
  const pag = await prisma.pagamento.findUnique({
    where: { id: pagamentoId },
    select: {
      plantao: { select: { clinicaId: true, profissionalPublicadorId: true, clinica: { select: { userId: true } }, profissionalPublicador: { select: { userId: true } } } },
      candidatura: { select: { profissional: { select: { userId: true } } } },
      reservaSala: { select: { profissional: { select: { userId: true } } } },
    },
  });
  if (!pag) return false;

  const donos = [
    pag.plantao?.clinica?.userId,
    pag.plantao?.profissionalPublicador?.userId,
    pag.candidatura?.profissional?.userId,
    pag.reservaSala?.profissional?.userId,
  ].filter(Boolean);

  return donos.includes(session.id);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const { id: pagamentoId } = await params;
  const body = await request.json() as GatewayInput;

  if (!body.metodo || !["MULTICAIXA_EXPRESS", "TPA"].includes(body.metodo)) {
    return Response.json({ error: "Método inválido para processamento automático" }, { status: 400 });
  }

  // Verificar propriedade
  const ehDono = await verificarPropriedade(pagamentoId, session);
  if (!ehDono) {
    return Response.json({ error: "Não autorizado para este pagamento" }, { status: 403 });
  }

  const pagamento = await prisma.pagamento.findUnique({
    where: { id: pagamentoId },
    select: { estado: true, valorBrutoAoa: true, metodo: true },
  });

  if (!pagamento) return Response.json({ error: "Pagamento não encontrado" }, { status: 404 });
  if (pagamento.estado !== "PENDENTE") {
    return Response.json({ error: "Pagamento já processado" }, { status: 409 });
  }

  // Simular gateway
  const resultado = simularGateway(body, pagamento.valorBrutoAoa);

  if (!resultado.sucesso) {
    await prisma.pagamento.update({
      where: { id: pagamentoId },
      data: {
        estado: "FALHOU",
        falhaMotivo: resultado.mensagem,
        referenciaExt: resultado.codigo,
      },
    });
    return Response.json({ sucesso: false, mensagem: resultado.mensagem, codigo: resultado.codigo }, { status: 422 });
  }

  // Sucesso — actualizar método e executar confirmação
  try {
    await prisma.$transaction(async (tx) => {
      await tx.pagamento.update({
        where: { id: pagamentoId },
        data: {
          metodo: body.metodo,
          referenciaExt: resultado.codigo,
        },
      });
      await executarConfirmacao(pagamentoId, tx);
    });
  } catch (err) {
    console.error("[gateway] confirmation failed:", err);
    return Response.json({ error: "Erro ao confirmar pagamento. Tente novamente." }, { status: 500 });
  }

  return Response.json({ sucesso: true, mensagem: resultado.mensagem, codigo: resultado.codigo });
}
