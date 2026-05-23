import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const acaoSchema = z.object({
  acao: z.enum(["aceitar", "recusar", "cancelar"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  let rawBody: unknown;
  try { rawBody = await req.json(); } catch { return Response.json({ error: "Body inválido" }, { status: 400 }); }
  const parsed = acaoSchema.safeParse(rawBody);
  if (!parsed.success) return Response.json({ error: "Ação inválida" }, { status: 400 });

  const { acao } = parsed.data;

  const convite = await prisma.convite.findUnique({
    where: { id },
    include: {
      clinicaRemetente: { select: { userId: true, id: true } },
      profissionalRemetente: { select: { userId: true, id: true, especialidade: true } },
      profissionalDestinatario: { select: { userId: true, id: true } },
      consultorioDestinatario: { select: { userId: true, id: true } },
      sala: { select: { id: true, precoPorHora: true, nome: true } },
    },
  });

  if (!convite) return Response.json({ error: "Convite não encontrado" }, { status: 404 });
  if (convite.estado !== "PENDENTE") return Response.json({ error: "Este convite já foi respondido" }, { status: 409 });

  const isRemetente =
    convite.clinicaRemetente?.userId === session.id ||
    convite.profissionalRemetente?.userId === session.id;
  const isDestinatario =
    convite.profissionalDestinatario?.userId === session.id ||
    convite.consultorioDestinatario?.userId === session.id;

  if (acao === "cancelar" && !isRemetente) {
    return Response.json({ error: "Apenas o remetente pode cancelar" }, { status: 403 });
  }
  if ((acao === "aceitar" || acao === "recusar") && !isDestinatario) {
    return Response.json({ error: "Apenas o destinatário pode aceitar ou recusar" }, { status: 403 });
  }

  const novoEstado =
    acao === "aceitar" ? "ACEITE" :
    acao === "recusar" ? "RECUSADO" :
    "CANCELADO";

  // When accepted, automatically create the corresponding record
  if (acao === "aceitar") {
    return await prisma.$transaction(async (tx) => {
      const atualizado = await tx.convite.update({
        where: { id },
        data: { estado: novoEstado, respondidoEm: new Date() },
      });

      // CLINICA → MÉDICO: create Plantao + Candidatura
      if (convite.tipo === "CLINICA_PARA_MEDICO" && convite.clinicaRemetente && convite.profissionalDestinatario && convite.dataInicio && convite.dataFim && convite.valorKwanzas) {
        const plantao = await tx.plantao.create({
          data: {
            clinicaId: convite.clinicaRemetente.id,
            especialidade: convite.especialidade ?? "Geral",
            dataInicio: convite.dataInicio,
            dataFim: convite.dataFim,
            valorKwanzas: convite.valorKwanzas,
            vagas: 1,
            vagasPreenchidas: 1,
            estado: "FECHADO",
            descricao: convite.mensagem ?? undefined,
          },
        });
        await tx.candidatura.create({
          data: {
            plantaoId: plantao.id,
            profissionalId: convite.profissionalDestinatario.id,
            estado: "ACEITE",
            respondidoEm: new Date(),
          },
        });
      }

      // MÉDICO → MÉDICO: create Plantao (publicadoPorMedico) + Candidatura
      if (convite.tipo === "MEDICO_PARA_MEDICO" && convite.profissionalRemetente && convite.profissionalDestinatario && convite.dataInicio && convite.dataFim && convite.valorKwanzas) {
        const plantao = await tx.plantao.create({
          data: {
            profissionalPublicadorId: convite.profissionalRemetente.id,
            publicadoPorMedico: true,
            especialidade: convite.especialidade ?? convite.profissionalRemetente.especialidade,
            dataInicio: convite.dataInicio,
            dataFim: convite.dataFim,
            valorKwanzas: convite.valorKwanzas,
            vagas: 1,
            vagasPreenchidas: 1,
            estado: "FECHADO",
            descricao: convite.mensagem ?? undefined,
          },
        });
        await tx.candidatura.create({
          data: {
            plantaoId: plantao.id,
            profissionalId: convite.profissionalDestinatario.id,
            estado: "ACEITE",
            respondidoEm: new Date(),
          },
        });
      }

      // MÉDICO → CONSULTÓRIO: create ReservaSala
      if (convite.tipo === "MEDICO_PARA_CONSULTORIO" && convite.salaId && convite.profissionalRemetente && convite.dataInicio && convite.duracaoHoras) {
        const precoPorHora = convite.sala?.precoPorHora ?? 0;
        const horaInicio = convite.dataInicio.toTimeString().slice(0, 5);
        const dataFim = new Date(convite.dataInicio.getTime() + convite.duracaoHoras * 60 * 60 * 1000);

        await tx.reservaSala.create({
          data: {
            salaId: convite.salaId,
            profissionalId: convite.profissionalRemetente.id,
            data: convite.dataInicio,
            horaInicio,
            duracaoHoras: convite.duracaoHoras,
            valorTotal: precoPorHora * convite.duracaoHoras,
            estado: "CONFIRMADA",
            dataFim,
          },
        });
      }

      return Response.json(atualizado);
    });
  }

  const atualizado = await prisma.convite.update({
    where: { id },
    data: { estado: novoEstado, respondidoEm: new Date() },
  });

  return Response.json(atualizado);
}
