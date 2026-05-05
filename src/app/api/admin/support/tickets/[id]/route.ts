/**
 * GET /api/admin/support/tickets/[id]
 * Obter detalhes completo de um ticket (admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = headers();
    const auth = await verifyAuth(headersList);

    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas admins" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Obter ticket com detalhes completos
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        respostas: {
          include: {
            autor: {
              select: {
                id: true,
                email: true,
                role: true,
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

    return NextResponse.json({
      ticket: {
        id: ticket.id,
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
    console.error("Error fetching admin ticket:", error);
    return NextResponse.json(
      { error: "Erro ao obter ticket" },
      { status: 500 }
    );
  }
}
