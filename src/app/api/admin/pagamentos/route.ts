import { requireAdminAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireAdminAccess("financeiro", "read");
  if (auth instanceof Response) return auth;

  const pagamentos = await prisma.pagamento.findMany({
    where: { estado: { in: ["PENDENTE", "CONFIRMADO"] } },
    include: {
      plantao: {
        select: {
          especialidade: true,
          dataInicio: true,
          valorKwanzas: true,
          estado: true,
          clinica: { select: { nome: true } },
          profissionalPublicador: { select: { nome: true } },
        },
      },
      candidatura: {
        select: {
          id: true,
          estado: true,
          profissional: { select: { nome: true, especialidade: true } },
          plantao: {
            select: {
              especialidade: true,
              dataInicio: true,
              clinica: { select: { nome: true } },
              profissionalPublicador: { select: { nome: true } },
            },
          },
        },
      },
      reservaSala: {
        select: {
          data: true,
          horaInicio: true,
          duracaoHoras: true,
          valorTotal: true,
          estado: true,
          sala: {
            select: {
              nome: true,
              clinica: { select: { nome: true } },
            },
          },
          profissional: { select: { nome: true } },
        },
      },
    },
    orderBy: { criadoEm: "desc" },
  });

  return Response.json(
    pagamentos.map((p) => {
      // A pagamento linked to a candidatura is a taxa de reserva from the médico.
      // We use the candidatura's plantao info (which may differ from p.plantao).
      const isTaxaReserva = !!p.candidaturaId && !!p.candidatura;

      return {
        id: p.id,
        tipo: p.tipo,
        subtipo: isTaxaReserva ? "TAXA_RESERVA" : "PUBLICACAO",
        estado: p.estado,
        valorBrutoAoa: p.valorBrutoAoa,
        comissaoAoa: p.comissaoAoa,
        valorLiquidoAoa: p.valorLiquidoAoa,
        metodo: p.metodo,
        criadoEm: p.criadoEm.toISOString(),
        pagoEm: p.pagoEm?.toISOString() ?? null,
        plantao: !isTaxaReserva && p.plantao
          ? {
              especialidade: p.plantao.especialidade,
              dataInicio: p.plantao.dataInicio.toISOString(),
              valorKwanzas: p.plantao.valorKwanzas,
              estado: p.plantao.estado,
              publicadoPor: p.plantao.clinica?.nome ?? p.plantao.profissionalPublicador?.nome ?? "—",
            }
          : null,
        candidatura: isTaxaReserva && p.candidatura
          ? {
              id: p.candidatura.id,
              estado: p.candidatura.estado,
              medicoNome: p.candidatura.profissional.nome,
              medicoEspecialidade: p.candidatura.profissional.especialidade,
              plantaoEspecialidade: p.candidatura.plantao.especialidade,
              plantaoData: p.candidatura.plantao.dataInicio.toISOString(),
              publicadoPor: p.candidatura.plantao.clinica?.nome ?? p.candidatura.plantao.profissionalPublicador?.nome ?? "—",
            }
          : null,
        reservaSala: p.reservaSala
          ? {
              data: p.reservaSala.data.toISOString(),
              horaInicio: p.reservaSala.horaInicio,
              duracaoHoras: p.reservaSala.duracaoHoras,
              valorTotal: p.reservaSala.valorTotal,
              estado: p.reservaSala.estado,
              salaNome: p.reservaSala.sala.nome,
              clinicaNome: p.reservaSala.sala.clinica?.nome ?? "—",
              medicoNome: p.reservaSala.profissional.nome,
            }
          : null,
      };
    })
  );
}
