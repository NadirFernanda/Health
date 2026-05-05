/**
 * Página de suporte para utilizador
 * GET /support
 */

"use client";

import { useState } from "react";
import { CreateTicketForm } from "@/components/support-ticket-form";
import { TicketList } from "@/components/support-ticket-list";

export default function SupportPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string>();
  const [refreshKey, setRefreshKey] = useState(0);

  function handleTicketCreated(ticketId: string) {
    setShowForm(false);
    setSelectedTicketId(ticketId);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Centro de Suporte</h1>
              <p className="text-gray-600 mt-2">
                Abra um ticket para receber ajuda da nossa equipa de suporte
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
            >
              {showForm ? "Cancelar" : "+ Novo Ticket"}
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Formulário ou Lista */}
          <div className="lg:col-span-2">
            {showForm ? (
              <div className="bg-white rounded-2xl border shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Novo Ticket de Suporte</h2>
                <CreateTicketForm onSuccess={handleTicketCreated} />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Meus Tickets</h2>
                <TicketList key={refreshKey} selectedTicketId={selectedTicketId} />
              </div>
            )}
          </div>

          {/* Coluna Direita - Informações Úteis */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dicas Úteis</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-semibold">1</span>
                  <span>Descreva o seu problema o máximo possível</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-semibold">2</span>
                  <span>Indique a prioridade correctamente</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-semibold">3</span>
                  <span>Forneça contactos válidos para resposta rápida</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-semibold">4</span>
                  <span>Acompanhe o seu ticket e responda rapidamente</span>
                </li>
              </ul>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">Tempo de Resposta</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex justify-between">
                    <span>Urgente:</span>
                    <span className="font-medium">{'< 2 horas'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Alta:</span>
                    <span className="font-medium">{'< 4 horas'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Normal:</span>
                    <span className="font-medium">{'< 24 horas'}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
