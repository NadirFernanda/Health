import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? "";
  const especialidade = searchParams.get("especialidade") ?? "";
  const verificado = searchParams.get("verificado");
  const disponivel = searchParams.get("disponivel");

  const medicos = await prisma.profissional.findMany({
    where: {
      ...(q && {
        OR: [
          { nome: { contains: q, mode: "insensitive" } },
          { especialidade: { contains: q, mode: "insensitive" } },
          { subEspecialidade: { contains: q, mode: "insensitive" } },
          { cidade: { contains: q, mode: "insensitive" } },
        ],
      }),
      ...(especialidade && { especialidade: { contains: especialidade, mode: "insensitive" } }),
      ...(verificado === "true" && { verified: true }),
      ...(disponivel === "true" && { disponivelAgora: true }),
    },
    select: {
      id: true,
      nome: true,
      tipo: true,
      especialidade: true,
      subEspecialidade: true,
      provincia: true,
      cidade: true,
      foto: true,
      bio: true,
      rating: true,
      totalAvaliacoes: true,
      totalPlantoes: true,
      verified: true,
      anosExperiencia: true,
      disponivelAgora: true,
    },
    orderBy: [{ verified: "desc" }, { rating: "desc" }, { totalPlantoes: "desc" }],
    take: 50,
  });

  return Response.json(medicos);
}
