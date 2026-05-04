import { NextRequest } from "next/server";
import { requireSession, getClinicaFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

// Comissão da plataforma: 10%
const COMISSAO_PERCENTAGEM = 0.10;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;
  const clinica = await getClinicaFromSession(auth.session);
  if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

  const { id } = await params;

  const candidaturas = await prisma.candidatura.findMany({
    where: { plantaoId: id, plantao: { clinicaId: clinica.id } },
    include: { profissional: true },
    orderBy: { criadoEm: "desc" },
  });

  return Response.json(
    candidaturas.map((c) => ({
      id: c.id,
      estado: c.estado,
      criadoEm: c.criadoEm.toISOString(),
      profissional: {
        id: c.profissional.id,
        nome: c.profissional.nome,
        tipo: c.profissional.tipo,
        especialidade: c.profissional.especialidade,
        numeroSinome: c.profissional.numeroSinome ?? "",
        rating: c.profissional.rating,
        totalAvaliacoes: c.profissional.totalAvaliacoes,
        totalPlantoes: c.profissional.totalPlantoes,
        verified: c.profissional.verified,
        bio: c.profissional.bio ?? "",
      },
    }))
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;
  const clinica = await getClinicaFromSession(auth.session);
  if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

  const { id: plantaoId } = await params;
  const { candidaturaId, estado } = await request.json();

  if (!candidaturaId || !["ACEITE", "RECUSADO"].includes(estado)) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Verificar que a candidatura pertence a um plantão desta clínica
  const candidatura = await prisma.candidatura.findFirst({
    where: { id: candidaturaId, plantaoId, plantao: { clinicaId: clinica.id } },
    include: { plantao: true, profissional: true },
  });
  if (!candidatura) return Response.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.candidatura.update({
      where: { id: candidaturaId },
      data: { estado, respondidoEm: new Date() },
    });

    if (estado === "ACEITE") {
      const valorBruto = candidatura.plantao.valorKwanzas;
      const comissao = Math.round(valorBruto * COMISSAO_PERCENTAGEM);
      const valorLiquido = valorBruto - comissao;

      await tx.pagamento.create({
        data: {
          tipo: "TURNO",
          plantaoId,
          candidaturaId,
          beneficiarioProfissionalId: candidatura.profissionalId,
          valorBrutoAoa: valorBruto,
          comissaoAoa: comissao,
          valorLiquidoAoa: valorLiquido,
          metodo: "TRANSFERENCIA_BANCARIA",
          estado: "CONFIRMADO",
        },
      });

      // Incrementar vagas preenchidas
      const novasVagasPreenchidas = candidatura.plantao.vagasPreenchidas + 1;
      const novoEstado = novasVagasPreenchidas >= candidatura.plantao.vagas ? "FECHADO" : "ABERTO";

      await tx.plantao.update({
        where: { id: plantaoId },
        data: { vagasPreenchidas: { increment: 1 }, estado: novoEstado },
      });

      // Se o plantão ficou cheio, rejeitar automaticamente as candidaturas pendentes restantes
      if (novoEstado === "FECHADO") {
        await tx.candidatura.updateMany({
          where: { plantaoId, estado: "PENDENTE", id: { not: candidaturaId } },
          data: { estado: "RECUSADO", respondidoEm: new Date() },
        });
      }

      // Notificar o médico aceite
      await tx.notificacao.create({
        data: {
          userId: candidatura.profissional.userId,
          tipo: "CANDIDATURA",
          titulo: "Candidatura aceite!",
          corpo: `A tua candidatura para o plantão de ${candidatura.plantao.especialidade} foi aceite.`,
          href: `/medico/plantoes/${plantaoId}`,
        },
      });
    }

    if (estado === "RECUSADO") {
      // Notificar o médico recusado
      await tx.notificacao.create({
        data: {
          userId: candidatura.profissional.userId,
          tipo: "CANDIDATURA",
          titulo: "Candidatura não seleccionada",
          corpo: `A tua candidatura para o plantão de ${candidatura.plantao.especialidade} não foi seleccionada desta vez.`,
          href: "/medico/plantoes",
        },
      });
    }
  });

  return Response.json({ estado });
}
