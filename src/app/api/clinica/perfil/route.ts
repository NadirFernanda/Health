import { requireSession, getClinicaFromSession } from "@/lib/api-auth";

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
