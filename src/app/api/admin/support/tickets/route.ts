/**
 * GET /api/admin/support/tickets
 * Listar todos os tickets (admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminAccess } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAccess("suporte", "read");
    if (authResult instanceof Response) return authResult;

    // Parâmetros de query
    const searchParams = request.nextUrl.searchParams;
    const estado = searchParams.get("estado");
    const categoria = searchParams.get("categoria");
    const prioridade = searchParams.get("prioridade");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Construir where clause
    const where: any = {};

    if (estado && ["ABERTO", "EM_ANDAMENTO", "FECHADO"].includes(estado)) {
      where.estado = estado;
    }

    if (categoria) {
      where.categoria = categoria;
    }

    if (prioridade && ["NORMAL", "ALTA", "URGENTE"].includes(prioridade)) {
      where.prioridade = prioridade;
    }

    if (search) {
      where.OR = [
        { assunto: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { userProvidedId: { contains: search, mode: "insensitive" } },
        { contactoEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    // Obter tickets
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
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
          { prioridade: "asc" }, // Depois por prioridade (urgente=0)
          { criadoEm: "desc" }, // Depois por data (mais recentes)
        ],
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return NextResponse.json({
      tickets: tickets.map((t) => ({
        id: t.id,
        numero: t.numero,
        assunto: t.assunto,
        categoria: t.categoria,
        estado: t.estado,
        prioridade: t.prioridade,
        criadoEm: t.criadoEm,
        atualizadoEm: t.atualizadoEm,
        user: t.user,
        userProvidedId: t.userProvidedId,
        contactoEmail: t.contactoEmail,
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
    console.error("Error fetching admin tickets:", error);
    return NextResponse.json(
      { error: "Erro ao obter tickets" },
      { status: 500 }
    );
  }
}
