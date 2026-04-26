import { NextRequest } from "next/server";
import { requireSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;
  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  return Response.json({
    id: prof.id,
    nome: prof.nome,
    tipo: prof.tipo,
    especialidade: prof.especialidade,
    subEspecialidade: prof.subEspecialidade ?? "",
    anosExperiencia: prof.anosExperiencia ?? 0,
    numeroOrdem: prof.numeroOrdem ?? "",
    numeroSinome: prof.numeroSinome ?? "",
    numeroOma: prof.numeroOma ?? "",
    provincia: prof.provincia,
    foto: prof.foto ?? "",
    bio: prof.bio ?? "",
    rating: prof.rating,
    totalAvaliacoes: prof.totalAvaliacoes,
    totalPlantoes: prof.totalPlantoes,
    verified: prof.verified,
    saldoCarteira: prof.saldoCarteira,
    saldoCentavos: prof.saldoCarteiraCentavos.toString(),
    disponivelAgora: prof.disponivelAgora,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;
  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  const body = await request.json();
  const updated = await prisma.profissional.update({
    where: { id: prof.id },
    data: {
      ...(typeof body.disponivelAgora === "boolean" && { disponivelAgora: body.disponivelAgora }),
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.subEspecialidade !== undefined && { subEspecialidade: body.subEspecialidade }),
      ...(body.anosExperiencia !== undefined && { anosExperiencia: parseInt(body.anosExperiencia) }),
    },
  });

  return Response.json({ disponivelAgora: updated.disponivelAgora });
}
