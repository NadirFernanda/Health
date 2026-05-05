/**
 * Página de detalhes de um ticket de suporte
 * GET /support/tickets/[id]
 */

import { TicketThread } from "@/components/support-ticket-thread";

export default function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <a
            href="/support"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-3 block"
          >
            ← Voltar ao suporte
          </a>
          <h1 className="text-2xl font-bold text-gray-900">Detalhes do Ticket</h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border shadow-lg p-8">
          <TicketThread ticketId={id} />
        </div>
      </div>
    </div>
  );
}

import React from "react";
