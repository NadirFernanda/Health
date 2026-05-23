import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return Response.json([]);

  const consultorios = await prisma.consultorio.findMany({
    where: {
      nome: { contains: q, mode: "insensitive" },
    },
    select: {
      id: true,
      nome: true,
      bairro: true,
      cidade: true,
      rating: true,
      verified: true,
      salas: {
        where: { disponivel: true, ativo: true },
        select: { id: true, nome: true, tipo: true, precoPorHora: true, zona: true },
        take: 10,
      },
    },
    take: 8,
    orderBy: [{ verified: "desc" }, { rating: "desc" }],
  });

  return Response.json(consultorios);
}
