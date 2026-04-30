import { NextRequest } from "next/server";
import { requireSession, getClinicaFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;
  const clinica = await getClinicaFromSession(auth.session);
  if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

  return Response.json({
    id: clinica.id,
    nome: clinica.nome,
    morada: clinica.morada ?? "",
    bairro: clinica.bairro ?? "",
    cidade: clinica.cidade ?? "",
    provincia: clinica.provincia,
    zonaLuanda: clinica.zonaLuanda ?? "",
    contacto: clinica.contacto ?? "",
    website: clinica.website ?? "",
    descricao: clinica.descricao ?? "",
    logo: clinica.logo ?? "",
    rating: clinica.rating,
    totalAvaliacoes: clinica.totalAvaliacoes,
    verified: clinica.verified,
    criadoEm: clinica.criadoEm.toISOString(),
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;
  const clinica = await getClinicaFromSession(auth.session);
  if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

  const body = await request.json();
  const { morada, contacto, website, descricao } = body as Record<string, string>;

  const updated = await prisma.clinica.update({
    where: { id: clinica.id },
    data: {
      ...(morada !== undefined && { morada }),
      ...(contacto !== undefined && { contacto }),
      ...(website !== undefined && { website }),
      ...(descricao !== undefined && { descricao }),
    },
  });

  return Response.json({ ok: true, id: updated.id });
}

