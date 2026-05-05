/**
 * POST /api/support/tickets/[id]/reply
 * Responder a um ticket
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import {
  reopenTicketIfClosed,
  markTicketAsInProgress,
  notifyUserNewReply,
} from "@/lib/support-utils";
import { z } from "zod";

const ReplySchema = z.object({
  corpo: z
    .string()
    .min(5, "Resposta deve ter pelo menos 5 caracteres")
    .max(3000, "Resposta não pode exceder 3000 caracteres"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = headers();
    const auth = await verifyAuth(headersList);

    if (!auth) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validar payload
    const body = await request.json();
    const data = ReplySchema.parse(body);

    // Obter ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões
    const isOwner = ticket.userId === auth.id;
    const isAdmin = auth.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    // Criar reply
    const reply = await prisma.supportTicketReply.create({
      data: {
        ticketId: id,
        autorUserId: auth.id,
        corpo: data.corpo,
        isAdminReply: isAdmin,
      },
    });

    // Se é resposta do utilizador, reabrir ticket se estava fechado
    if (!isAdmin) {
      await reopenTicketIfClosed(id);
    }

    // Se é resposta do admin, marcar como em andamento e notificar utilizador
    if (isAdmin) {
      await markTicketAsInProgress(id);
      await notifyUserNewReply(id);
    } else {
      // Se é resposta do utilizador, notificar admins
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
      });

      const notificacoes = admins.map((admin) =>
        prisma.notificacao.create({
          data: {
            userId: admin.id,
            tipo: "support_ticket_user_reply",
            titulo: `Nova resposta em #${ticket.id.slice(0, 8)}`,
            corpo: `${ticket.user.email} respondeu ao seu ticket`,
            href: `/admin/support/tickets/${ticket.id}`,
          },
        })
      );

      await Promise.all(notificacoes);
    }

    return NextResponse.json(
      {
        message: "Resposta criada com sucesso",
        reply: {
          id: reply.id,
          corpo: reply.corpo,
          isAdminReply: reply.isAdminReply,
          criadoEm: reply.criadoEm,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating reply:", error);
    return NextResponse.json(
      { error: "Erro ao criar resposta" },
      { status: 500 }
    );
  }
}
