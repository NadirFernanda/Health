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
    cidade: clinica.cidade ?? "",
    provincia: clinica.provincia,
    logo: clinica.logo ?? "",
    rating: clinica.rating,
    totalAvaliacoes: clinica.totalAvaliacoes,
    verified: clinica.verified,
  });
}
