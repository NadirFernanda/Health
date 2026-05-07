import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

function buildNumero(id: string, criadoEm: Date) {
  return `MF-${criadoEm.getFullYear()}-${id.slice(-8).toUpperCase()}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const pagamento = await prisma.pagamento.findUnique({
    where: { id },
    include: {
      plantao: {
        select: {
          especialidade: true,
          dataInicio: true,
          clinica: { select: { userId: true, nome: true } },
          profissionalPublicador: { select: { userId: true, nome: true } },
        },
      },
      candidatura: {
        select: {
          profissional: { select: { userId: true, nome: true } },
        },
      },
      reservaSala: {
        select: {
          data: true,
          profissional: { select: { userId: true, nome: true } },
          sala: { select: { nome: true } },
        },
      },
    },
  });

  if (!pagamento) return Response.json({ error: "Não encontrado" }, { status: 404 });

  const userId = session.id;
  let pagadorNome = "—";
  let autorizado = session.role === "ADMIN";

  if (!autorizado && pagamento.plantao) {
    if (pagamento.plantao.clinica?.userId === userId) {
      autorizado = true;
      pagadorNome = pagamento.plantao.clinica.nome;
    } else if (pagamento.plantao.profissionalPublicador?.userId === userId) {
      autorizado = true;
      pagadorNome = pagamento.plantao.profissionalPublicador.nome;
    }
  }
  if (!autorizado && pagamento.candidatura?.profissional?.userId === userId) {
    autorizado = true;
    pagadorNome = pagamento.candidatura.profissional.nome;
  }
  if (!autorizado && pagamento.reservaSala?.profissional?.userId === userId) {
    autorizado = true;
    pagadorNome = pagamento.reservaSala.profissional.nome;
  }

  if (!autorizado) return Response.json({ error: "Sem permissão" }, { status: 403 });

  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-AO", { day: "2-digit", month: "2-digit", year: "numeric" });

  let descricao = "";
  let subTipo: "PUBLICACAO" | "TAXA_RESERVA" | "RESERVA_SALA" = "PUBLICACAO";

  if (pagamento.plantao && pagamento.candidaturaId) {
    subTipo = "TAXA_RESERVA";
    const data = pagamento.plantao.dataInicio ? " · " + fmt(pagamento.plantao.dataInicio) : "";
    descricao = `Taxa de reserva — ${pagamento.plantao.especialidade}${data}`;
  } else if (pagamento.plantao) {
    subTipo = "PUBLICACAO";
    const data = pagamento.plantao.dataInicio ? " · " + fmt(pagamento.plantao.dataInicio) : "";
    descricao = `Publicação de plantão — ${pagamento.plantao.especialidade}${data}`;
  } else if (pagamento.reservaSala) {
    subTipo = "RESERVA_SALA";
    const data = pagamento.reservaSala.data ? " · " + fmt(pagamento.reservaSala.data) : "";
    descricao = `Reserva de sala — ${pagamento.reservaSala.sala?.nome ?? "Sala"}${data}`;
  }

  return Response.json({
    numero: buildNumero(pagamento.id, pagamento.criadoEm),
    pagoEm: (pagamento.pagoEm ?? pagamento.atualizadoEm).toISOString(),
    metodo: pagamento.metodo,
    valor: pagamento.valorBrutoAoa,
    comissao: pagamento.comissaoAoa,
    estado: pagamento.estado,
    subTipo,
    descricao,
    pagador: pagadorNome,
    referencia: pagamento.id.slice(-12).toUpperCase(),
  });
}
