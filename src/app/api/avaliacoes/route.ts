import { NextRequest } from "next/server";
import { requireSession, getProfissionalFromSession, getClinicaFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth instanceof Response) return auth;
  const { session } = auth;

  const body = await request.json();
  const { estrelas, comentario, alvoClinicaId, alvoMedicoId, salaId, plantaoId, tipo } = body;

  if (!estrelas || estrelas < 1 || estrelas > 5) {
    return Response.json({ error: "Avaliação inválida (1-5 estrelas)" }, { status: 400 });
  }

  let autorId: string | undefined;

  if (session.role === "MEDICO") {
    const prof = await getProfissionalFromSession(session);
    if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });
    autorId = prof.id;

    // Verificar que o médico trabalhou neste plantão/reservou esta sala
    if (plantaoId && alvoClinicaId) {
      const candidaturaValida = await prisma.candidatura.findFirst({
        where: {
          plantaoId,
          profissionalId: prof.id,
          estado: "ACEITE",
          plantao: { estado: "CONCLUIDO" },
        },
      });
      if (!candidaturaValida) {
        return Response.json(
          { error: "Só podes avaliar após concluir o plantão" },
          { status: 403 }
        );
      }
    }

    if (salaId) {
      const reservaValida = await prisma.reservaSala.findFirst({
        where: { salaId, profissionalId: prof.id, estado: "CONCLUIDA" },
      });
      if (!reservaValida) {
        return Response.json(
          { error: "Só podes avaliar após concluir a reserva" },
          { status: 403 }
        );
      }
    }

    // Impedir avaliação duplicada
    const duplicado = await prisma.avaliacao.findFirst({
      where: {
        autorId: prof.id,
        ...(plantaoId && { plantaoId }),
        ...(salaId && { salaId }),
      },
    });
    if (duplicado) {
      return Response.json({ error: "Já avaliaste este plantão/sala" }, { status: 409 });
    }
  } else if (session.role === "CLINICA") {
    // Clínica avalia o médico que trabalhou num plantão seu
    if (alvoMedicoId && plantaoId) {
      const clinica = await getClinicaFromSession(session);
      if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

      const candidaturaValida = await prisma.candidatura.findFirst({
        where: {
          plantaoId,
          profissionalId: alvoMedicoId,
          estado: "ACEITE",
          plantao: { clinicaId: clinica.id, estado: "CONCLUIDO" },
        },
      });
      if (!candidaturaValida) {
        return Response.json(
          { error: "Só podes avaliar após o plantão ser concluído" },
          { status: 403 }
        );
      }

      const duplicado = await prisma.avaliacao.findFirst({
        where: { alvoMedicoId, plantaoId },
      });
      if (duplicado) {
        return Response.json({ error: "Este médico já foi avaliado neste plantão" }, { status: 409 });
      }
    }
  }

  const avaliacao = await prisma.avaliacao.create({
    data: {
      estrelas,
      comentario,
      autorId,
      alvoClinicaId,
      alvoMedicoId,
      salaId,
      plantaoId,
      tipo: tipo ?? (salaId ? "SALA" : "TURNO"),
    },
  });

  // Recalcular rating do alvo em paralelo
  const updates: Promise<unknown>[] = [];

  if (alvoClinicaId) {
    updates.push(
      prisma.avaliacao
        .aggregate({ where: { alvoClinicaId }, _avg: { estrelas: true }, _count: { estrelas: true } })
        .then((s) =>
          prisma.clinica.update({
            where: { id: alvoClinicaId },
            data: { rating: s._avg.estrelas ?? 0, totalAvaliacoes: s._count.estrelas },
          })
        )
    );
  }
  if (alvoMedicoId) {
    updates.push(
      prisma.avaliacao
        .aggregate({ where: { alvoMedicoId }, _avg: { estrelas: true }, _count: { estrelas: true } })
        .then((s) =>
          prisma.profissional.update({
            where: { id: alvoMedicoId },
            data: { rating: s._avg.estrelas ?? 0, totalAvaliacoes: s._count.estrelas },
          })
        )
    );
  }
  if (salaId) {
    updates.push(
      prisma.avaliacao
        .aggregate({ where: { salaId }, _avg: { estrelas: true }, _count: { estrelas: true } })
        .then((s) =>
          prisma.sala.update({
            where: { id: salaId },
            data: { avaliacaoMedia: s._avg.estrelas ?? 0, totalAvaliacoes: s._count.estrelas },
          })
        )
    );
  }

  await Promise.all(updates);

  return Response.json({ id: avaliacao.id }, { status: 201 });
}
