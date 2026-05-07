"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, MessageCircle, Clock, Tag, CheckCircle, Circle, Send } from "lucide-react";
import { formatTicketRef } from "@/lib/support-constants";

interface Reply {
  id: string;
  corpo: string;
  isAdminReply: boolean;
  criadoEm: string;
  autor: { id: string; email: string; role: string };
}

interface Ticket {
  id: string;
  numero: number;
  assunto: string;
  categoria: string;
  estado: string;
  prioridade: string;
  criadoEm: string;
  atualizadoEm: string;
  user: { id: string; email: string };
  totalRespostas: number;
  ultimaResposta?: string;
}

interface TicketDetail extends Ticket {
  mensagem: string;
  contactoEmail?: string;
  contactoTelefone?: string;
  respostas: Reply[];
}

const estadoBadge: Record<string, { cls: string; label: string; icon: typeof Circle }> = {
  ABERTO:       { cls: "bg-yellow-100 text-yellow-700", label: "Aberto",       icon: Circle },
  EM_ANDAMENTO: { cls: "bg-blue-100 text-blue-700",    label: "Em Andamento",  icon: Clock },
  FECHADO:      { cls: "bg-gray-100 text-gray-500",    label: "Fechado",       icon: CheckCircle },
};

const prioridadeBadge: Record<string, { cls: string; label: string }> = {
  NORMAL:  { cls: "bg-gray-100 text-gray-500",      label: "Normal" },
  ALTA:    { cls: "bg-orange-100 text-orange-600",   label: "Alta" },
  URGENTE: { cls: "bg-red-100 text-red-600",         label: "Urgente" },
};

type Filtro = { estado: string; prioridade: string; search: string };

export function AdminSupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>({ estado: "", prioridade: "", search: "" });

  useEffect(() => {
    loadTickets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  async function loadTickets() {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      if (filtro.estado) p.set("estado", filtro.estado);
      if (filtro.prioridade) p.set("prioridade", filtro.prioridade);
      if (filtro.search) p.set("search", filtro.search);
      const res = await fetch(`/api/admin/support/tickets?${p}`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      setTickets((data as { tickets: Ticket[] }).tickets ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function openTicket(id: string) {
    setLoadingDetail(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      setDetail((data as { ticket: TicketDetail }).ticket);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleReply(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!detail || !replyText.trim()) return;
    setSubmitting(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/admin/support/tickets/${detail.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ corpo: replyText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      setReplyText("");
      await openTicket(detail.id);
      await loadTickets();
    } catch (e: unknown) {
      setReplyError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function updateEstado(estado: string) {
    if (!detail) return;
    try {
      const res = await fetch(`/api/admin/support/tickets/${detail.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ estado }),
      });
      if (res.ok) {
        setDetail((d) => d ? { ...d, estado } : d);
        setTickets((prev) => prev.map((t) => t.id === detail.id ? { ...t, estado } : t));
      }
    } catch { /* silent */ }
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  if (loadingDetail) return (
    <div className="flex justify-center pt-16">
      <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (detail) {
    const eb = estadoBadge[detail.estado] ?? estadoBadge.ABERTO;
    const pb = prioridadeBadge[detail.prioridade] ?? prioridadeBadge.NORMAL;
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-[#0B3C74]">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{detail.assunto}</p>
            <p className="text-xs text-gray-400 truncate">{detail.user.email}</p>
          </div>
          {/* Estado selector */}
          <select
            value={detail.estado}
            onChange={(e) => updateEstado(e.target.value)}
            className={`text-[10px] font-semibold px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${eb.cls}`}
          >
            <option value="ABERTO">Aberto</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="FECHADO">Fechado</option>
          </select>
        </div>

        {/* Meta */}
        <div className="bg-gray-50 px-4 py-2.5 flex flex-wrap gap-2 shrink-0 border-b border-gray-100">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pb.cls}`}>{pb.label}</span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Tag size={10} /> {detail.categoria}
          </span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Clock size={10} /> {new Date(detail.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          {detail.contactoEmail && (
            <span className="text-[10px] text-gray-400">{detail.contactoEmail}</span>
          )}
        </div>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {/* Mensagem original */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Mensagem original</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{detail.mensagem}</p>
          </div>

          {/* Respostas */}
          {detail.respostas.map((r) => (
            <div
              key={r.id}
              className={`rounded-2xl p-4 ${r.isAdminReply ? "bg-[#0B3C74]/5 border border-[#0B3C74]/10 ml-4" : "bg-white border border-gray-100 mr-4"}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-semibold text-gray-500">
                  {r.isAdminReply ? "Suporte" : r.autor.email}
                </p>
                <p className="text-[10px] text-gray-300">
                  {new Date(r.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.corpo}</p>
            </div>
          ))}
        </div>

        {/* Reply form */}
        {detail.estado !== "FECHADO" && (
          <form onSubmit={handleReply} className="border-t border-gray-100 bg-white px-4 py-3 shrink-0">
            {replyError && <p className="text-xs text-red-500 mb-2">{replyError}</p>}
            <div className="flex gap-2 items-end">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escreve a tua resposta..."
                rows={2}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0B3C74] resize-none"
              />
              <button
                type="submit"
                disabled={submitting || !replyText.trim()}
                className="shrink-0 bg-[#0B3C74] disabled:opacity-40 text-white p-3 rounded-xl transition-opacity"
              >
                <Send size={16} strokeWidth={2} />
              </button>
            </div>
          </form>
        )}
        {detail.estado === "FECHADO" && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-center text-xs text-gray-400 shrink-0">
            Ticket fechado · <button onClick={() => updateEstado("ABERTO")} className="text-[#0B3C74] font-semibold">Reabrir</button>
          </div>
        )}
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4 pb-10 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-base font-bold text-gray-900">Tickets de Suporte</h1>
        <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2.5 py-1 rounded-full">
          {tickets.length} total
        </span>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(["", "ABERTO", "EM_ANDAMENTO", "FECHADO"] as const).map((e) => {
          const labels: Record<string, string> = { "": "Todos", ABERTO: "Abertos", EM_ANDAMENTO: "Em Andamento", FECHADO: "Fechados" };
          return (
            <button
              key={e}
              onClick={() => setFiltro((f) => ({ ...f, estado: e }))}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filtro.estado === e ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-600"}`}
            >
              {labels[e]}
            </button>
          );
        })}
        {(["", "NORMAL", "ALTA", "URGENTE"] as const).map((p) => {
          if (!p) return null;
          const pb = prioridadeBadge[p];
          return (
            <button
              key={p}
              onClick={() => setFiltro((f) => ({ ...f, prioridade: f.prioridade === p ? "" : p }))}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filtro.prioridade === p ? pb.cls : "bg-gray-100 text-gray-600"}`}
            >
              {pb.label}
            </button>
          );
        })}
      </div>

      {/* Pesquisa */}
      <input
        type="text"
        placeholder="Pesquisar por assunto ou email..."
        value={filtro.search}
        onChange={(e) => setFiltro((f) => ({ ...f, search: e.target.value }))}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0B3C74]"
      />

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl p-4 text-center">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center pt-8">
          <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Lista */}
      {!loading && (
        <div className="space-y-3">
          {tickets.map((t) => {
            const eb = estadoBadge[t.estado] ?? estadoBadge.ABERTO;
            const pb = prioridadeBadge[t.prioridade] ?? prioridadeBadge.NORMAL;
            return (
              <button
                key={t.id}
                onClick={() => openTicket(t.id)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 p-4 active:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 flex-1 truncate">{t.assunto}</p>
                  <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${eb.cls}`}>{eb.label}</span>
                </div>
                <p className="text-[10px] font-mono text-[#0B3C74] mt-0.5">{formatTicketRef(t.numero)}</p>
                <p className="text-xs text-gray-400 truncate">{t.user.email}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                  <span className={`font-semibold px-1.5 py-0.5 rounded-md ${pb.cls}`}>{pb.label}</span>
                  <span className="flex items-center gap-1"><Tag size={10} /> {t.categoria}</span>
                  {t.totalRespostas > 0 && (
                    <span className="flex items-center gap-1"><MessageCircle size={10} /> {t.totalRespostas}</span>
                  )}
                  <span className="ml-auto flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(t.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              </button>
            );
          })}

          {tickets.length === 0 && (
            <div className="text-center py-14 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
              Nenhum ticket encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
