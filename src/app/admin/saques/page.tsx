"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Check, X, AlertTriangle, ArrowDownToLine, ChevronRight, Search } from "lucide-react";

type Saque = {
  id: string;
  estado: string;
  valorAoa: number;
  dadosBancarios: { banco: string; titular: string; iban: string };
  motivoRejeicao: string | null;
  criadoEm: string;
  processadoEm: string | null;
  profissional: { id: string; nome: string; especialidade: string; email: string };
};

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(Math.round(v)) + " AOA";
}

const ESTADO_CFG: Record<string, { label: string; cls: string }> = {
  PENDENTE:  { label: "Pendente",  cls: "bg-yellow-100 text-yellow-700" },
  APROVADO:  { label: "Aprovado",  cls: "bg-green-100 text-green-700" },
  REJEITADO: { label: "Rejeitado", cls: "bg-red-100 text-red-700" },
  CANCELADO: { label: "Cancelado", cls: "bg-gray-100 text-gray-500" },
};

export default function AdminSaques() {
  const [lista, setLista] = useState<Saque[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"PENDENTE" | "TODOS">("PENDENTE");
  const [pesquisa, setPesquisa] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState("");
  const [actionError, setActionError] = useState<{ id: string; msg: string } | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/saques", { credentials: "include" });
      if (r.ok) setLista(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function acao(id: string, acao: "APROVAR" | "REJEITAR", motivo?: string) {
    setActionLoading(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/saques/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao, motivo }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setActionError({ id, msg: (d as { error?: string }).error ?? `Erro HTTP ${res.status}` });
        return;
      }
      setRejectModal(null);
      setRejectMotivo("");
      await carregar();
    } catch {
      setActionError({ id, msg: "Erro de ligação." });
    } finally {
      setActionLoading(null);
    }
  }

  const pendentes = lista.filter((s) => s.estado === "PENDENTE").length;
  const q = pesquisa.toLowerCase();
  const filtered = lista.filter((s) => {
    const matchStatus = filtro === "TODOS" || s.estado === "PENDENTE";
    const matchSearch = !q ||
      s.profissional.nome.toLowerCase().includes(q) ||
      s.profissional.email.toLowerCase().includes(q) ||
      s.dadosBancarios.banco.toLowerCase().includes(q) ||
      s.dadosBancarios.titular.toLowerCase().includes(q) ||
      s.dadosBancarios.iban.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-4 space-y-4 pb-10 max-w-3xl mx-auto">
      <h1 className="text-base font-bold text-gray-900">Pedidos de Levantamento</h1>

      {/* Filtros de estado */}
      <div className="flex gap-2">
        {(["PENDENTE", "TODOS"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filtro === f ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "PENDENTE" ? `Por processar (${pendentes})` : `Todos (${lista.length})`}
          </button>
        ))}
      </div>

      {/* Pesquisa */}
      <div className="relative">
        <Search size={15} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Pesquisar por profissional, banco, IBAN…"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/20"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin text-[#0B3C74]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
          <ArrowDownToLine size={28} className="mx-auto mb-2 text-gray-300" strokeWidth={1.25} />
          {filtro === "PENDENTE" ? "Nenhum pedido pendente." : "Nenhum pedido registado."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const cfg = ESTADO_CFG[s.estado] ?? ESTADO_CFG.PENDENTE;
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{formatAOA(s.valorAoa)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(s.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                </div>

                {/* Profissional */}
                <Link
                  href={`/admin/carteiras/${s.profissional.id}`}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{s.profissional.nome}</p>
                    <p className="text-[11px] text-gray-400">{s.profissional.especialidade} · {s.profissional.email}</p>
                  </div>
                  <ChevronRight size={14} strokeWidth={2} className="text-gray-300" />
                </Link>

                {/* Bank details */}
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-600 font-semibold">{s.dadosBancarios.banco}</p>
                  <p className="text-xs text-gray-500">Titular: {s.dadosBancarios.titular}</p>
                  <p className="text-xs text-gray-400 font-mono">{s.dadosBancarios.iban}</p>
                </div>

                {s.motivoRejeicao && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{s.motivoRejeicao}</p>
                )}

                {actionError?.id === s.id && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
                    <AlertTriangle size={12} strokeWidth={2} /> {actionError.msg}
                  </div>
                )}

                {s.estado === "PENDENTE" && (
                  <div className="flex gap-2">
                    <button
                      disabled={actionLoading === s.id}
                      onClick={() => acao(s.id, "APROVAR")}
                      className="flex-1 bg-[#00A99D] hover:bg-[#009082] disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      {actionLoading === s.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Check size={13} strokeWidth={2.5} />}
                      APROVAR
                    </button>
                    <button
                      disabled={actionLoading === s.id}
                      onClick={() => { setRejectModal(s.id); setRejectMotivo(""); }}
                      className="flex-1 border border-red-200 hover:bg-red-50 disabled:opacity-50 text-red-500 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      <X size={13} strokeWidth={2.5} /> REJEITAR
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-5 space-y-4">
            <h2 className="font-bold text-gray-900">Motivo de rejeição</h2>
            <textarea
              value={rejectMotivo}
              onChange={(e) => setRejectMotivo(e.target.value)}
              placeholder="Descreve o motivo para o profissional…"
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300/30 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-3 rounded-2xl"
              >
                Cancelar
              </button>
              <button
                disabled={!rejectMotivo.trim() || actionLoading === rejectModal}
                onClick={() => acao(rejectModal, "REJEITAR", rejectMotivo)}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold py-3 rounded-2xl flex items-center justify-center gap-2"
              >
                {actionLoading === rejectModal ? <Loader2 size={14} className="animate-spin" /> : <X size={14} strokeWidth={2.5} />}
                Confirmar rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
