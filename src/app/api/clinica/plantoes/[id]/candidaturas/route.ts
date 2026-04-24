import { NextRequest } from "next/server";
import { requireSession, getClinicaFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

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
  });
  if (!candidatura) return Response.json({ error: "Não encontrado" }, { status: 404 });

  const updated = await prisma.candidatura.update({
    where: { id: candidaturaId },
    data: { estado },
  });

  return Response.json({ id: updated.id, estado: updated.estado });
}
