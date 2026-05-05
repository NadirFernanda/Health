/**
 * Componente para visualizar e responder a um ticket de suporte
 */

"use client";

import { FormEvent, useEffect, useState } from "react";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/support-utils";

interface Author {
  id: string;
  email: string;
}

interface Reply {
  id: string;
  corpo: string;
  isAdminReply: boolean;
  criadoEm: string;
  autor: Author;
}

interface Ticket {
  id: string;
  assunto: string;
  mensagem: string;
  categoria: string;
  estado: string;
  prioridade: string;
  userProvidedId?: string;
  contactoEmail?: string;
  contactoTelefone?: string;
  criadoEm: string;
  atualizadoEm: string;
  user: Author;
  respostas: Reply[];
}

interface TicketThreadProps {
  ticketId: string;
}

export function TicketThread({ ticketId }: TicketThreadProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Carregar ticket
  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  async function fetchTicket() {
    try {
      setLoading(true);
      const response = await fetch(`/api/support/tickets/${ticketId}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar ticket");
      }

      const data = await response.json();
      setTicket(data.ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ corpo: replyText }),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar resposta");
      }

      setReplyText("");
      await fetchTicket(); // Recarregar para mostrar nova resposta
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Carregando ticket...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        Ticket não encontrado
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Ticket */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{ticket.assunto}</h2>
            <p className="text-gray-600 text-sm mt-1">#{ticket.id.slice(0, 8)}</p>
          </div>
          <div className="flex gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                ticket.estado === "ABERTO"
                  ? "bg-blue-100 text-blue-800"
                  : ticket.estado === "EM_ANDAMENTO"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {STATUS_LABELS[ticket.estado]}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                ticket.prioridade === "URGENTE"
                  ? "bg-red-100 text-red-800"
                  : ticket.prioridade === "ALTA"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-green-100 text-green-800"
              }`}
            >
              {PRIORITY_LABELS[ticket.prioridade]}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Categoria:</span>
            <p className="text-gray-900 font-medium">{ticket.categoria}</p>
          </div>
          <div>
            <span className="text-gray-600">Criado em:</span>
            <p className="text-gray-900 font-medium">
              {new Date(ticket.criadoEm).toLocaleDateString("pt-AO")}
            </p>
          </div>
        </div>

        {/* Informações de Contacto */}
        {(ticket.userProvidedId || ticket.contactoEmail || ticket.contactoTelefone) && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-gray-900 mb-2">Informações de Contacto:</p>
            <div className="space-y-1 text-sm text-gray-600">
              {ticket.userProvidedId && <p>ID/Referência: {ticket.userProvidedId}</p>}
              {ticket.contactoEmail && <p>Email: {ticket.contactoEmail}</p>}
              {ticket.contactoTelefone && <p>Telefone: {ticket.contactoTelefone}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Mensagem Original */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <p className="text-sm font-medium text-gray-900 mb-3">Sua Mensagem</p>
        <p className="text-gray-700 whitespace-pre-wrap">{ticket.mensagem}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Thread de Respostas */}
      {ticket.respostas.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Respostas</h3>
          {ticket.respostas.map((reply) => (
            <div
              key={reply.id}
              className={`border rounded-lg p-4 ${
                reply.isAdminReply ? "bg-blue-50 border-blue-200" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-900">
                  {reply.isAdminReply ? "🔒 Suporte" : "Você"}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(reply.criadoEm).toLocaleDateString("pt-AO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{reply.corpo}</p>
            </div>
          ))}
        </div>
      )}

      {/* Formulário de Resposta */}
      {ticket.estado !== "FECHADO" && (
        <form onSubmit={handleReply} className="space-y-3 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900">Responder</h3>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Escreva sua resposta aqui..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={5}
            maxLength={3000}
          />
          <button
            type="submit"
            disabled={submitting || !replyText.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            {submitting ? "Enviando..." : "Enviar Resposta"}
          </button>
        </form>
      )}

      {ticket.estado === "FECHADO" && (
        <div className="p-4 bg-gray-50 border rounded-lg text-gray-600 text-center">
          Este ticket foi fechado. Não é possível adicionar mais respostas.
        </div>
      )}
    </div>
  );
}
