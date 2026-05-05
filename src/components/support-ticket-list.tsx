/**
 * Componente para listar tickets de suporte do utilizador
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/support-constants";

interface TicketItem {
  id: string;
  assunto: string;
  categoria: string;
  estado: string;
  prioridade: string;
  criadoEm: string;
  atualizadoEm: string;
  totalRespostas: number;
  ultimaResposta?: string;
}

interface TicketListProps {
  selectedTicketId?: string;
}

export function TicketList({ selectedTicketId }: TicketListProps) {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<string>("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchTickets();
  }, [estado, page]);

  async function fetchTickets() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (estado) params.append("estado", estado);
      params.append("page", page.toString());
      params.append("limit", "10");

      const response = await fetch(`/api/support/tickets?${params}`);

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!response.ok) {
        throw new Error("Erro ao carregar tickets");
      }

      const data = await response.json();
      setTickets(data.tickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENTE":
        return "text-red-700 bg-red-50";
      case "ALTA":
        return "text-orange-700 bg-orange-50";
      default:
        return "text-green-700 bg-green-50";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ABERTO":
        return "text-blue-700 bg-blue-50";
      case "EM_ANDAMENTO":
        return "text-yellow-700 bg-yellow-50";
      case "FECHADO":
        return "text-gray-700 bg-gray-50";
      default:
        return "text-gray-700 bg-gray-50";
    }
  };

  if (loading && tickets.length === 0) {
    return <div className="text-center py-8 text-gray-500">Carregando tickets...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtro */}
      <div className="flex gap-2">
        <button
          onClick={() => { setEstado(""); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            estado === "" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => { setEstado("ABERTO"); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            estado === "ABERTO" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
          }`}
        >
          Abertos
        </button>
        <button
          onClick={() => { setEstado("EM_ANDAMENTO"); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            estado === "EM_ANDAMENTO" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
          }`}
        >
          Em Andamento
        </button>
        <button
          onClick={() => { setEstado("FECHADO"); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            estado === "FECHADO" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
          }`}
        >
          Fechados
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Lista de Tickets */}
      {tickets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum ticket encontrado nesta categoria
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/support/tickets/${ticket.id}`}
              className={`block p-4 rounded-lg border transition ${ 
                selectedTicketId === ticket.id 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{ticket.assunto}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    #{ticket.id.slice(0, 8)} • {new Date(ticket.criadoEm).toLocaleDateString("pt-AO")}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{ticket.categoria}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.estado)}`}>
                    {STATUS_LABELS[ticket.estado]}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.prioridade)}`}>
                    {PRIORITY_LABELS[ticket.prioridade]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {ticket.totalRespostas} resposta{ticket.totalRespostas !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
