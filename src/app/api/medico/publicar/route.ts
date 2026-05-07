import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession, getProfissionalFromSession } from "@/lib/api-auth";

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.role !== "MEDICO") {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const prof = await getProfissionalFromSession(session);
  if (!prof) return Response.json({ error: "Profissional não encontrado" }, { status: 404 });

  const plantoes = await prisma.plantao.findMany({
    where: { profissionalPublicadorId: prof.id },
    include: { _count: { select: { candidaturas: true } } },
    orderBy: { dataInicio: "desc" },
  });

  return Response.json(
    plantoes.map((p) => ({
      id: p.id,
      especialidade: p.especialidade,
      tipoProfissional: p.tipoProfissional,
      dataInicio: p.dataInicio.toISOString(),
      dataFim: p.dataFim.toISOString(),
      valorKwanzas: p.valorKwanzas,
      vagas: p.vagas,
      vagasPreenchidas: p.vagasPreenchidas,
      estado: p.estado,
      descricao: p.descricao,
      candidaturas: p._count.candidaturas,
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.role !== "MEDICO") {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const prof = await getProfissionalFromSession(session);
  if (!prof) return Response.json({ error: "Profissional não encontrado" }, { status: 404 });

  const body = await request.json();
  const {
    tipoProfissional, especialidade, dataInicio, dataFim,
    valorKwanzas, vagas, descricao, metodo,
    maca, estetoscopio, tensiometro, termometro, computador,
    materiaisBasicos, nebulizador, oximetro, glucometro, desfibrilador,
  } = body;

  if (!especialidade || !dataInicio || !dataFim || !valorKwanzas || !vagas) {
    return Response.json({ error: "Campos obrigatórios em falta" }, { status: 400 });
  }

  const metodoPagamento = (["MULTICAIXA_EXPRESS", "TPA"].includes(metodo) ? metodo : "TRANSFERENCIA_BANCARIA") as "MULTICAIXA_EXPRESS" | "TPA" | "TRANSFERENCIA_BANCARIA";
  const valorInt = parseInt(valorKwanzas);
  const comissao = Math.round(valorInt * 0.15);

  const { plantao, pagamento } = await prisma.$transaction(async (tx) => {
    const p = await tx.plantao.create({
      data: {
        profissionalPublicadorId: prof.id,
        publicadoPorMedico: true,
        tipoProfissional: tipoProfissional ?? "MEDICO",
        especialidade,
        dataInicio: new Date(dataInicio),
        dataFim: new Date(dataFim),
        valorKwanzas: valorInt,
        valorCentavos: BigInt(valorInt) * 100n,
        vagas: parseInt(vagas),
        descricao: descricao ?? null,
        estado: "AGUARDANDO_PAGAMENTO",
        maca: maca ?? false,
        estetoscopio: estetoscopio ?? false,
        tensiometro: tensiometro ?? false,
        termometro: termometro ?? false,
        computador: computador ?? false,
        materiaisBasicos: materiaisBasicos ?? true,
        nebulizador: nebulizador ?? false,
        oximetro: oximetro ?? false,
        glucometro: glucometro ?? false,
        desfibrilador: desfibrilador ?? false,
      },
    });
    const pag = await tx.pagamento.create({
      data: {
        tipo: "TURNO",
        plantaoId: p.id,
        valorBrutoAoa: valorInt,
        comissaoAoa: comissao,
        valorLiquidoAoa: valorInt - comissao,
        metodo: metodoPagamento,
        estado: "PENDENTE",
      },
    });
    return { plantao: p, pagamento: pag };
  });

  return Response.json({ id: plantao.id, pagamentoId: pagamento.id, valorKwanzas: valorInt, metodo: metodoPagamento }, { status: 201 });
}
