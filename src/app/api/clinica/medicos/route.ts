import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;

  const sp = req.nextUrl.searchParams;

  // If requesting meta (specialties + provincias for dropdowns)
  if (sp.get("meta") === "1") {
    const [especialidades, provincias] = await Promise.all([
      prisma.profissional.findMany({ select: { especialidade: true }, distinct: ["especialidade"], orderBy: { especialidade: "asc" } }),
      prisma.profissional.findMany({ select: { provincia: true }, distinct: ["provincia"], orderBy: { provincia: "asc" } }),
    ]);
    return Response.json({
      especialidades: especialidades.map((e) => e.especialidade),
      provincias: provincias.map((p) => p.provincia),
    });
  }

  const q          = sp.get("q") ?? "";
  const tipo       = sp.get("tipo") ?? "";
  const especialidade = sp.get("especialidade") ?? "";
  const provincia  = sp.get("provincia") ?? "";
  const verificado = sp.get("verificado") === "true";
  const disponivel = sp.get("disponivel") === "true";
  const ratingMin  = parseFloat(sp.get("ratingMin") ?? "0") || 0;
  const expMin     = parseInt(sp.get("expMin") ?? "0") || 0;
  const ordenar    = sp.get("ordenar") ?? "rating"; // rating | experiencia | plantoes | nome

  const where = {
    ...(q && {
      OR: [
        { nome: { contains: q, mode: "insensitive" as const } },
        { especialidade: { contains: q, mode: "insensitive" as const } },
        { subEspecialidade: { contains: q, mode: "insensitive" as const } },
        { cidade: { contains: q, mode: "insensitive" as const } },
        { bio: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(tipo && { tipo: tipo as never }),
    ...(especialidade && { especialidade: { contains: especialidade, mode: "insensitive" as const } }),
    ...(provincia && { provincia: { contains: provincia, mode: "insensitive" as const } }),
    ...(verificado && { verified: true }),
    ...(disponivel && { disponivelAgora: true }),
    ...(ratingMin > 0 && { rating: { gte: ratingMin } }),
    ...(expMin > 0 && { anosExperiencia: { gte: expMin } }),
  };

  const orderBy =
    ordenar === "experiencia" ? [{ anosExperiencia: "desc" as const }, { rating: "desc" as const }]
    : ordenar === "plantoes"  ? [{ totalPlantoes: "desc" as const }, { rating: "desc" as const }]
    : ordenar === "nome"      ? [{ nome: "asc" as const }]
    : /* rating (default) */    [{ verified: "desc" as const }, { rating: "desc" as const }, { totalPlantoes: "desc" as const }];

  const medicos = await prisma.profissional.findMany({
    where,
    select: {
      id: true, nome: true, tipo: true, especialidade: true, subEspecialidade: true,
      provincia: true, cidade: true, foto: true, rating: true, totalAvaliacoes: true,
      totalPlantoes: true, verified: true, anosExperiencia: true, disponivelAgora: true,
    },
    orderBy,
    take: 60,
  });

  return Response.json({ medicos, total: medicos.length });
}
