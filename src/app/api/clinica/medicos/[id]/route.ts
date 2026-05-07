import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const prof = await prisma.profissional.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      tipo: true,
      especialidade: true,
      subEspecialidade: true,
      provincia: true,
      cidade: true,
      bairro: true,
      foto: true,
      bio: true,
      rating: true,
      totalAvaliacoes: true,
      totalPlantoes: true,
      verified: true,
      verificadoEm: true,
      anosExperiencia: true,
      disponivelAgora: true,
      numeroOrdem: true,
      numeroSinome: true,
      numeroOma: true,
      credenciais: {
        select: { tipo: true, comentario: true, estado: true, criadoEm: true },
        where: { estado: "APROVADO" },
      },
      documentos: {
        select: { tipo: true, ficheiro: true, estado: true, criadoEm: true },
        where: { tipo: "CURRICULO", estado: { in: ["APROVADO", "PENDENTE"] } },
        take: 1,
      },
      avaliacoesRecebidas: {
        select: { estrelas: true, comentario: true, criadoEm: true },
        orderBy: { criadoEm: "desc" },
        take: 5,
      },
    },
  });

  if (!prof) return Response.json({ error: "Médico não encontrado" }, { status: 404 });
  return Response.json(prof);
}
