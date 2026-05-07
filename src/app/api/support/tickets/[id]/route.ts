/**
 * GET /api/support/tickets/[id]
 * Obter detalhes de um ticket específico
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireSession();
    if (authResult instanceof Response) return authResult;
    const { session: auth } = authResult;

    const { id } = await params;

    // Obter ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        respostas: {
          include: {
            autor: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: { criadoEm: "asc" },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o utilizador é o proprietário ou um admin
    if (ticket.userId !== auth.id && auth.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        numero: ticket.numero,
        assunto: ticket.assunto,
        mensagem: ticket.mensagem,
        categoria: ticket.categoria,
        estado: ticket.estado,
        prioridade: ticket.prioridade,
        userProvidedId: ticket.userProvidedId,
        contactoEmail: ticket.contactoEmail,
        contactoTelefone: ticket.contactoTelefone,
        criadoEm: ticket.criadoEm,
        atualizadoEm: ticket.atualizadoEm,
        user: ticket.user,
        respostas: ticket.respostas.map((r) => ({
          id: r.id,
          corpo: r.corpo,
          isAdminReply: r.isAdminReply,
          criadoEm: r.criadoEm,
          autor: r.autor,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Erro ao obter ticket" },
      { status: 500 }
    );
  }
}
