export const TICKET_CATEGORIES = [
  { value: "pagamento", label: "Problema de Pagamento" },
  { value: "tecnico", label: "Problema Técnico" },
  { value: "agendamento", label: "Agendamento/Plantão" },
  { value: "conta", label: "Problemas na Conta" },
  { value: "verificacao", label: "Verificação de Credenciais" },
  { value: "outro", label: "Outro" },
] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number]["value"];

export function isValidCategory(category: string): category is TicketCategory {
  return TICKET_CATEGORIES.some((c) => c.value === category);
}

export function getCategoryLabel(category: TicketCategory): string {
  return TICKET_CATEGORIES.find((c) => c.value === category)?.label || category;
}

export const PRIORITY_LABELS: Record<string, string> = {
  NORMAL: "Normal",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const STATUS_LABELS: Record<string, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em Andamento",
  FECHADO: "Fechado",
};

/** Formats a ticket sequential number as "TKT-0042" */
export function formatTicketRef(numero: number): string {
  return `TKT-${numero.toString().padStart(4, "0")}`;
}
