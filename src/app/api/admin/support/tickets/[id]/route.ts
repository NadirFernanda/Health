/**
 * GET /api/admin/support/tickets/[id]
 * Obter detalhes completo de um ticket (admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminAccess } from "@/lib/api-auth";
import { markTicketAsInProgress, notifyUserNewReply } from "@/lib/support-utils";
import { sendPushToUser } from "@/lib/push";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminAccess("suporte", "read");
    if (authResult instanceof Response) return authResult;

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminAccess("suporte", "write");
    if (authResult instanceof Response) return authResult;
    const { session } = authResult;

    const { id } = await params;
    const { corpo } = await request.json();
    if (!corpo || typeof corpo !== "string" || corpo.trim().length < 2) {
      return NextResponse.json({ error: "Resposta inválida" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, userId: true, assunto: true },
    });
    if (!ticket) return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });

    const reply = await prisma.supportTicketReply.create({
      data: { ticketId: id, autorUserId: session.id, corpo: corpo.trim(), isAdminReply: true },
      include: { autor: { select: { id: true, email: true, role: true } } },
    });

    await markTicketAsInProgress(id);
    await notifyUserNewReply(id);
    sendPushToUser(ticket.userId, {
      title: `Resposta do Suporte: ${ticket.assunto}`,
      body: "Um membro do suporte respondeu ao seu ticket",
      href: `/support/tickets/${id}`,
      tag: "SUPORTE",
    }).catch(() => {});

    return NextResponse.json({
      id: reply.id,
      corpo: reply.corpo,
      isAdminReply: true,
      criadoEm: reply.criadoEm,
      autor: reply.autor,
    }, { status: 201 });
  } catch (error) {
    console.error("Error posting admin reply:", error);
    return NextResponse.json({ error: "Erro ao enviar resposta" }, { status: 500 });
  }
}
