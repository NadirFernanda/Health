import { NextRequest } from "next/server";
import { requireSession, getClinicaFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

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

  if (!candidaturaId || !["CONTRATO_PENDENTE", "RECUSADO"].includes(estado)) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const candidatura = await prisma.candidatura.findFirst({
    where: { id: candidaturaId, plantaoId, plantao: { clinicaId: clinica.id } },
    include: { plantao: true, profissional: true },
  });
  if (!candidatura) return Response.json({ error: "Não encontrado" }, { status: 404 });

  if (estado === "CONTRATO_PENDENTE") {
    const pushData = {
      userId: candidatura.profissional.userId,
      title: "Contrato para assinar",
      body: `A ${clinica.nome} aceitou a sua candidatura para o plantão de ${candidatura.plantao.especialidade}.`,
      href: `/medico/plantoes/${plantaoId}/contrato`,
    };
    await prisma.$transaction(async (tx) => {
      await tx.candidatura.update({
        where: { id: candidaturaId },
        data: { estado: "CONTRATO_PENDENTE", contratoGeradoEm: new Date() },
      });

      // Close the shift immediately so no new applications arrive while contract is pending
      const claimed = await tx.candidatura.count({
        where: { plantaoId, estado: { in: ["CONTRATO_PENDENTE", "ACEITE"] } },
      });
      if (claimed >= candidatura.plantao.vagas) {
        await tx.plantao.update({ where: { id: plantaoId }, data: { estado: "FECHADO" } });
        await tx.candidatura.updateMany({
          where: { plantaoId, estado: "PENDENTE" },
          data: { estado: "RECUSADO", respondidoEm: new Date() },
        });
      }

      await tx.notificacao.create({
        data: {
          userId: pushData.userId,
          tipo: "CONTRATO",
          titulo: pushData.title,
          corpo: `A ${clinica.nome} aceitou a sua candidatura. Reveja e assine o contrato para confirmar o plantão de ${candidatura.plantao.especialidade}.`,
          href: pushData.href,
        },
      });
    });
    sendPushToUser(pushData.userId, { title: pushData.title, body: pushData.body, href: pushData.href, tag: "CONTRATO" }).catch(() => {});
  }

  if (estado === "RECUSADO") {
    const pushData = {
      userId: candidatura.profissional.userId,
      title: "Candidatura não seleccionada",
      body: `A tua candidatura para o plantão de ${candidatura.plantao.especialidade} não foi seleccionada desta vez.`,
      href: "/medico/plantoes",
    };
    await prisma.$transaction(async (tx) => {
      await tx.candidatura.update({
        where: { id: candidaturaId },
        data: { estado: "RECUSADO", respondidoEm: new Date() },
      });
      await tx.notificacao.create({
        data: {
          userId: pushData.userId,
          tipo: "CANDIDATURA",
          titulo: pushData.title,
          corpo: pushData.body,
          href: pushData.href,
        },
      });
    });
    sendPushToUser(pushData.userId, { title: pushData.title, body: pushData.body, href: pushData.href, tag: "CANDIDATURA" }).catch(() => {});
  }

  return Response.json({ estado });
}
