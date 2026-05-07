import { requireSession, getClinicaFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { TIPOS_CLINICA } from "../route";

export async function POST() {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;

  const clinica = await getClinicaFromSession(auth.session);
  if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

  const docs = await prisma.clinicaDocumento.findMany({
    where: { clinicaId: clinica.id },
  });

  const tiposCarregados = docs.filter((d) => d.estado !== "NAO_ENVIADO" && d.ficheiro).map((d) => d.tipo);
  const faltam = TIPOS_CLINICA.filter((t) => !tiposCarregados.includes(t));

  if (faltam.length > 0) {
    return Response.json({ error: `Documentos em falta: ${faltam.join(", ")}` }, { status: 400 });
  }

  await prisma.clinica.update({
    where: { id: clinica.id },
    data: { estadoVerificacao: "EM_ANALISE" },
  });

  return Response.json({ ok: true, estadoVerificacao: "EM_ANALISE" });
}
