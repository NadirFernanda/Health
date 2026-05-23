import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const especialidade = searchParams.get("especialidade") ?? undefined;
  const tipo = searchParams.get("tipo") ?? undefined;

  if (q.length < 2) return Response.json([]);

  const profissionais = await prisma.profissional.findMany({
    where: {
      AND: [
        { nome: { contains: q, mode: "insensitive" } },
        especialidade ? { especialidade: { contains: especialidade, mode: "insensitive" } } : {},
        tipo ? { tipo: tipo as never } : {},
        { estadoVerificacao: "APROVADO" },
      ],
    },
    select: {
      id: true,
      nome: true,
      especialidade: true,
      tipo: true,
      foto: true,
      rating: true,
      verified: true,
      cidade: true,
    },
    take: 10,
    orderBy: [{ verified: "desc" }, { rating: "desc" }],
  });

  return Response.json(profissionais);
}
