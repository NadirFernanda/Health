/**
 * PUT /api/admin/support/tickets/[id]/status
 * Atualizar estado de um ticket
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminAccess } from "@/lib/api-auth";
import { z } from "zod";
import { sendPushToUser } from "@/lib/push";
import { createAuditLog } from "@/lib/audit-logger";

const UpdateStatusSchema = z.object({
  estado: z.enum(["ABERTO", "EM_ANDAMENTO", "FECHADO"]),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminAccess("suporte", "write");
    if (authResult instanceof Response) return authResult;

    const { id } = await params;

    // Validar payload
    const body = await request.json();
    const data = UpdateStatusSchema.parse(body);

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

    // Atualizar estado
    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: {
        estado: data.estado,
      },
    });

    // Notificar utilizador se o estado mudou
    if (ticket.estado !== data.estado) {
      const estadoLabel: Record<string, string> = {
        ABERTO: "reaberto",
        EM_ANDAMENTO: "em andamento",
        FECHADO: "fechado",
      };
      const titulo = `Status do ticket #${ticket.id.slice(0, 8)} atualizado`;
      const corpo = `Seu ticket foi marcado como ${estadoLabel[data.estado]}`;
      const href = `/support/tickets/${ticket.id}`;

      await prisma.notificacao.create({
        data: { userId: ticket.userId, tipo: "support_ticket_status_changed", titulo, corpo, href },
      });
      sendPushToUser(ticket.userId, { title: titulo, body: corpo, href, tag: "SUPORTE" }).catch(() => {});
    }

    if (ticket.estado !== data.estado) {
      await createAuditLog("admin_ticket_atualizado", {
        entity: "SupportTicket",
        entityId: id,
        estadoAnterior: ticket.estado,
        estadoNovo: data.estado,
      }, authResult.session.id);
    }

    return NextResponse.json({
      message: "Status atualizado com sucesso",
      ticket: {
        id: updatedTicket.id,
        estado: updatedTicket.estado,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating ticket status:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status" },
      { status: 500 }
    );
  }
}
