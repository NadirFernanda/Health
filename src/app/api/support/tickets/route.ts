/**
 * GET /api/support/tickets
 * Listar todos os tickets do utilizador autenticado
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSession();
    if (authResult instanceof Response) return authResult;
    const { session } = authResult;

    // Parâmetros de query
    const searchParams = request.nextUrl.searchParams;
    const estado = searchParams.get("estado");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filtrar por estado se fornecido
    const where: any = { userId: session.id };
    if (estado && ["ABERTO", "EM_ANDAMENTO", "FECHADO"].includes(estado)) {
      where.estado = estado;
    }

    // Obter tickets
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          respostas: {
            select: {
              id: true,
              criadoEm: true,
              isAdminReply: true,
            },
          },
        },
        orderBy: [
          { estado: "asc" }, // Abertos primeiro
          { prioridade: "asc" }, // Depois por prioridade
          { criadoEm: "desc" }, // Depois por data
        ],
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return NextResponse.json({
      tickets: tickets.map((t) => ({
        id: t.id,
        assunto: t.assunto,
        categoria: t.categoria,
        estado: t.estado,
        prioridade: t.prioridade,
        criadoEm: t.criadoEm,
        atualizadoEm: t.atualizadoEm,
        totalRespostas: t.respostas.length,
        ultimaResposta: t.respostas[t.respostas.length - 1]?.criadoEm,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Erro ao obter tickets" },
      { status: 500 }
    );
  }
}
