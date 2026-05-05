/**
 * Utilitários para o sistema de support tickets
 */

import { prisma } from "@/lib/db";

// Re-export client-safe constants from the constants-only file
export {
  TICKET_CATEGORIES,
  type TicketCategory,
  isValidCategory,
  getCategoryLabel,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "@/lib/support-constants";

/**
 * Enviar notificação para todos os admins sobre novo ticket
 */
export async function notifyAdminsNewTicket(ticketId: string): Promise<void> {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { user: true },
  });

  if (!ticket) return;

  // Obter todos os admins
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
  });

  // Criar notificações para cada admin
  const notificacoes = admins.map((admin) =>
    prisma.notificacao.create({
      data: {
        userId: admin.id,
        tipo: "support_ticket_new",
        titulo: `Novo Ticket de Suporte #${ticket.id.slice(0, 8)}`,
        corpo: `${ticket.user.email} abriu um ticket: ${ticket.assunto}`,
        href: `/admin/support/tickets/${ticket.id}`,
      },
    })
  );

  await Promise.all(notificacoes);
}

/**
 * Notificar utilizador sobre resposta do admin
 */
export async function notifyUserNewReply(ticketId: string): Promise<void> {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) return;

  await prisma.notificacao.create({
    data: {
      userId: ticket.userId,
      tipo: "support_ticket_reply",
      titulo: `Resposta do Suporte: ${ticket.assunto}`,
      corpo: "Um membro do suporte respondeu ao seu ticket",
      href: `/support/tickets/${ticket.id}`,
    },
  });
}

/**
 * Reabrir ticket se estiver fechado
 */
export async function reopenTicketIfClosed(ticketId: string): Promise<void> {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (ticket && ticket.estado === "FECHADO") {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { estado: "ABERTO" },
    });
  }
}

/**
 * Atualizar ticket para "Em Andamento" quando admin responde
 */
export async function markTicketAsInProgress(ticketId: string): Promise<void> {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (ticket && ticket.estado === "ABERTO") {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { estado: "EM_ANDAMENTO" },
    });
  }
}
