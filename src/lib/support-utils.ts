/**
 * Utilitários para o sistema de support tickets
 */

import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

/**
 * Opções de categoria de ticket
 */
export const TICKET_CATEGORIES = [
  { value: "pagamento", label: "Problema de Pagamento" },
  { value: "tecnico", label: "Problema Técnico" },
  { value: "agendamento", label: "Agendamento/Plantão" },
  { value: "conta", label: "Problemas na Conta" },
  { value: "verificacao", label: "Verificação de Credenciais" },
  { value: "outro", label: "Outro" },
] as const;

export type TicketCategory = typeof TICKET_CATEGORIES[number]["value"];

/**
 * Validar categoria de ticket
 */
export function isValidCategory(category: string): category is TicketCategory {
  return TICKET_CATEGORIES.some((c) => c.value === category);
}

/**
 * Obter label da categoria
 */
export function getCategoryLabel(category: TicketCategory): string {
  return TICKET_CATEGORIES.find((c) => c.value === category)?.label || category;
}

/**
 * Labels para prioridades
 */
export const PRIORITY_LABELS: Record<string, string> = {
  NORMAL: "Normal",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

/**
 * Labels para estados
 */
export const STATUS_LABELS: Record<string, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em Andamento",
  FECHADO: "Fechado",
};

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
  sendPushToUser(ticket.userId, {
    title: `Resposta do Suporte: ${ticket.assunto}`,
    body: "Um membro do suporte respondeu ao seu ticket",
    href: `/support/tickets/${ticket.id}`,
    tag: "SUPORTE",
  }).catch(() => {});
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
