import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireSession("ADMIN");
  if (auth instanceof Response) return auth;

  const estado = req.nextUrl.searchParams.get("estado");

  const disputas = await prisma.disputa.findMany({
    where: estado ? { estado: estado as never } : undefined,
    include: {
      iniciadoPor: { select: { id: true, role: true } },
      candidatura: {
        include: {
          profissional: { select: { nome: true, userId: true } },
          plantao: {
            select: {
              especialidade: true,
              dataInicio: true,
              valorKwanzas: true,
              clinica: { select: { nome: true, userId: true } },
              profissionalPublicador: { select: { nome: true } },
            },
          },
        },
      },
      mensagens: { orderBy: { criadoEm: "desc" }, take: 1 },
    },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(disputas.map((d) => ({
    id: d.id,
    tipo: d.tipo,
    estado: d.estado,
    descricao: d.descricao,
    criadoEm: d.criadoEm,
    resolvidoEm: d.resolvidoEm,
    ajusteValorKz: d.ajusteValorKz,
    resolucaoNota: d.resolucaoNota,
    iniciadoPorRole: d.iniciadoPor.role,
    medicoNome: d.candidatura.profissional.nome,
    medicoUserId: d.candidatura.profissional.userId,
    clinicaNome: d.candidatura.plantao.clinica?.nome ?? d.candidatura.plantao.profissionalPublicador?.nome ?? "—",
    clinicaUserId: d.candidatura.plantao.clinica?.userId,
    especialidade: d.candidatura.plantao.especialidade,
    valorKwanzas: d.candidatura.plantao.valorKwanzas,
    plantaoData: d.candidatura.plantao.dataInicio,
    ultimaMensagem: d.mensagens[0]?.criadoEm ?? null,
  })));
}
