/**
 * Componente Admin para gerenciar support tickets
 */

"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/support-utils";

interface User {
  id: string;
  email: string;
}

interface Reply {
  id: string;
  corpo: string;
  isAdminReply: boolean;
  criadoEm: string;
  autor: User;
}

interface AdminTicket {
  id: string;
  assunto: string;
  categoria: string;
  estado: string;
  prioridade: string;
  criadoEm: string;
  atualizadoEm: string;
  user: User;
  userProvidedId?: string;
  contactoEmail?: string;
  totalRespostas: number;
  ultimaResposta?: string;
}

interface AdminTicketDetail extends AdminTicket {
  mensagem: string;
  respostas: Reply[];
}

export function AdminSupportTickets() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<AdminTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  // Filtros
  const [estado, setEstado] = useState("");
  const [categoria, setCategoria] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTickets();
  }, [estado, categoria, prioridade, search]);

  async function fetchTickets() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (estado) params.append("estado", estado);
      if (categoria) params.append("categoria", categoria);
      if (prioridade) params.append("prioridade", prioridade);
      if (search) params.append("search", search);

      const response = await fetch(`/api/admin/support/tickets?${params}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar tickets");
      }

      const data = await response.json();
      setTickets(data.tickets);
      setSelectedTicket(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  async function selectTicket(ticketId: string) {
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar ticket");
      }

      const data = await response.json();
      setSelectedTicket(data.ticket);
      setNewStatus(data.ticket.estado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    }
  }

  async function handleReply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedTicket || !replyText.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}/reply`, {
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
      await selectTicket(selectedTicket.id); // Recarregar ticket
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange() {
    if (!selectedTicket || newStatus === selectedTicket.estado) return;

    try {
      const response = await fetch(`/api/admin/support/tickets/${selectedTicket.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar status");
      }

      await selectTicket(selectedTicket.id);
      await fetchTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    }
  }

  // Contar tickets por estado
  const estatisticas = {
    total: tickets.length,
    abertos: tickets.filter((t) => t.estado === "ABERTO").length,
    andamento: tickets.filter((t) => t.estado === "EM_ANDAMENTO").length,
    fechados: tickets.filter((t) => t.estado === "FECHADO").length,
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-screen overflow-hidden">
      {/* Painel Esquerdo - Lista de Tickets */}
      <div className="col-span-1 bg-white border-r flex flex-col overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            <div className="bg-blue-50 p-2 rounded">
              <p className="text-blue-700 font-semibold">{estatisticas.abertos}</p>
              <p className="text-blue-600">Abertos</p>
            </div>
            <div className="bg-yellow-50 p-2 rounded">
              <p className="text-yellow-700 font-semibold">{estatisticas.andamento}</p>
              <p className="text-yellow-600">Em Andamento</p>
            </div>
            <div className="bg-gray-50 p-2 rounded col-span-2">
              <p className="text-gray-700 font-semibold">{estatisticas.total} Total</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-4 border-b space-y-3 bg-gray-50">
          <input
            type="text"
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">Todos os estados</option>
            <option value="ABERTO">Aberto</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="FECHADO">Fechado</option>
          </select>

          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">Todas as prioridades</option>
            <option value="NORMAL">Normal</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>

        {/* Lista de Tickets */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 text-sm">Carregando...</div>
          ) : tickets.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">Nenhum ticket encontrado</div>
          ) : (
            <div className="space-y-1 p-2">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => selectTicket(ticket.id)}
                  className={`w-full text-left p-3 rounded border transition text-sm ${
                    selectedTicket?.id === ticket.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-gray-900 truncate">{ticket.assunto}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {ticket.user.email}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {STATUS_LABELS[ticket.estado]}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {PRIORITY_LABELS[ticket.prioridade]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Painel Direito - Detalhes do Ticket */}
      <div className="col-span-2 bg-white flex flex-col overflow-hidden">
        {selectedTicket ? (
          <>
            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTicket.assunto}</h3>
                  <p className="text-sm text-gray-600 mt-1">#{selectedTicket.id.slice(0, 8)}</p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="ABERTO">Aberto</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="FECHADO">Fechado</option>
                  </select>
                  <button
                    onClick={handleStatusChange}
                    disabled={newStatus === selectedTicket.estado}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-sm font-medium transition"
                  >
                    Atualizar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <span className="text-gray-600">Utilizador</span>
                  <p className="font-medium text-gray-900">{selectedTicket.user.email}</p>
                </div>
                <div>
                  <span className="text-gray-600">Categoria</span>
                  <p className="font-medium text-gray-900">{selectedTicket.categoria}</p>
                </div>
                <div>
                  <span className="text-gray-600">Criado em</span>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedTicket.criadoEm).toLocaleDateString("pt-AO")}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Respostas</span>
                  <p className="font-medium text-gray-900">{selectedTicket.totalRespostas}</p>
                </div>
              </div>

              {/* Info de Contacto */}
              {(selectedTicket.userProvidedId || selectedTicket.contactoEmail) && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">INFORMAÇÕES DE CONTACTO:</p>
                  <div className="flex gap-4 text-xs">
                    {selectedTicket.userProvidedId && (
                      <div>
                        <span className="text-gray-600">ID:</span>
                        <p className="font-medium">{selectedTicket.userProvidedId}</p>
                      </div>
                    )}
                    {selectedTicket.contactoEmail && (
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-medium">{selectedTicket.contactoEmail}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-b border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}

            {/* Conteúdo - Mensagem Original e Respostas */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Mensagem Original */}
              <div className="bg-gray-50 border rounded p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Mensagem Original</p>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedTicket.mensagem}</p>
              </div>

              {/* Thread de Respostas */}
              {selectedTicket.respostas.map((reply) => (
                <div
                  key={reply.id}
                  className={`border rounded p-4 ${
                    reply.isAdminReply ? "bg-blue-50 border-blue-200" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {reply.isAdminReply ? "🔒 Suporte" : "👤 " + reply.autor.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(reply.criadoEm).toLocaleDateString("pt-AO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.corpo}</p>
                </div>
              ))}
            </div>

            {/* Formulário de Resposta */}
            {selectedTicket.estado !== "FECHADO" && (
              <form
                onSubmit={handleReply}
                className="border-t p-6 space-y-3 bg-gray-50"
              >
                <label className="text-sm font-medium text-gray-900">Responder</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escreva sua resposta..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={5}
                  maxLength={3000}
                />
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded text-sm transition"
                >
                  {submitting ? "Enviando..." : "Enviar Resposta"}
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Selecione um ticket para ver os detalhes</p>
          </div>
        )}
      </div>
    </div>
  );
}
