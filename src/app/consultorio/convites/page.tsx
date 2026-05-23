"use client";
import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/nav";
import { Inbox, Calendar, Clock, MapPin, UserCheck } from "lucide-react";

type Convite = {
  id: string; tipo: string; estado: string; mensagem: string | null;
  dataInicio: string | null; duracaoHoras: number | null; criadoEm: string;
  profissionalRemetente?: { id: string; nome: string; especialidade: string; foto: string | null; verified: boolean } | null;
  sala?: { id: string; nome: string; tipo: string; precoPorHora: number } | null;
};

const estadoBadge: Record<string, { cls: string; label: string }> = {
  PENDENTE:  { cls: "bg-yellow-100 text-yellow-700", label: "Pendente" },
  ACEITE:    { cls: "bg-green-100 text-green-700",   label: "Aceite" },
  RECUSADO:  { cls: "bg-red-100 text-red-600",       label: "Recusado" },
  CANCELADO: { cls: "bg-gray-100 text-gray-500",     label: "Cancelado" },
};

function formatAOA(v: number) { return new Intl.NumberFormat("pt-AO").format(v) + " AOA"; }
function formatData(d: string) { return new Date(d).toLocaleDateString("pt-AO", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }); }
function formatHora(d: string) { return new Date(d).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" }); }

export default function ConsultorioConvites() {
  const [convites, setConvites] = useState<Convite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"TODOS" | "PENDENTE" | "ACEITE" | "RECUSADO">("TODOS");

  const loadConvites = useCallback(() => {
    setLoading(true);
    fetch("/api/convites")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) ? setConvites(d) : setConvites([]))
      .catch(() => setConvites([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadConvites(); }, [loadConvites]);

  async function responder(id: string, acao: "aceitar" | "recusar") {
    await fetch(`/api/convites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao }),
    });
    loadConvites();
  }

  const filtrados = filtro === "TODOS" ? convites : convites.filter((c) => c.estado === filtro);
  const pendentes = convites.filter((c) => c.estado === "PENDENTE").length;

  return (
    <div>
      <TopBar titulo="Pedidos de Sala" back="/consultorio" />

      {pendentes > 0 && (
        <div className="mx-4 mt-4 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-bold">{pendentes}</span>
          </div>
          <p className="text-xs text-yellow-800 font-medium">{pendentes === 1 ? "Tens 1 pedido pendente de resposta" : `Tens ${pendentes} pedidos pendentes de resposta`}</p>
        </div>
      )}

      {/* Filtros */}
      <div className="px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(["TODOS", "PENDENTE", "ACEITE", "RECUSADO"] as const).map((f) => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filtro === f ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {f === "TODOS" ? "Todos" : f.charAt(0) + f.slice(1).toLowerCase()}
              {f === "PENDENTE" && pendentes > 0 && ` (${pendentes})`}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-24 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-10"><div className="w-7 h-7 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" /></div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
            <Inbox size={32} strokeWidth={1.25} className="mx-auto mb-2 text-gray-300" />
            {filtro === "TODOS" ? "Ainda não recebeste nenhum pedido direto." : `Sem pedidos com estado "${filtro.toLowerCase()}".`}
          </div>
        ) : (
          filtrados.map((c) => {
            const badge = estadoBadge[c.estado] ?? { cls: "bg-gray-100 text-gray-500", label: c.estado };
            const valorTotal = c.sala && c.duracaoHoras ? c.sala.precoPorHora * c.duracaoHoras : null;
            return (
              <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-[#0B3C74]/10 flex items-center justify-center shrink-0">
                      <UserCheck size={16} strokeWidth={1.75} className="text-[#0B3C74]" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{c.profissionalRemetente?.nome ?? "—"}</p>
                      <p className="text-xs text-gray-400">{c.profissionalRemetente?.especialidade ?? ""}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                </div>

                {c.sala && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin size={12} strokeWidth={1.75} className="text-[#00A99D] shrink-0" />
                    <span className="text-xs font-semibold text-gray-700">{c.sala.nome}</span>
                    <span className="text-xs text-gray-400">({c.sala.tipo})</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 mb-2">
                  {c.dataInicio && (
                    <span className="flex items-center gap-1"><Calendar size={11} strokeWidth={1.75} />{formatData(c.dataInicio)} às {formatHora(c.dataInicio)}</span>
                  )}
                  {c.duracaoHoras && (
                    <span className="flex items-center gap-1"><Clock size={11} strokeWidth={1.75} />{c.duracaoHoras}h</span>
                  )}
                  {valorTotal !== null && (
                    <span className="font-semibold text-[#0B3C74]">{formatAOA(valorTotal)}</span>
                  )}
                </div>

                {c.mensagem && (
                  <p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-2.5 py-1.5 mb-3">"{c.mensagem}"</p>
                )}

                {c.estado === "PENDENTE" && (
                  <div className="flex gap-2">
                    <button onClick={() => responder(c.id, "aceitar")}
                      className="flex-1 bg-[#0B3C74] text-white rounded-xl py-2.5 text-xs font-semibold active:opacity-80 transition-opacity">
                      Aceitar pedido
                    </button>
                    <button onClick={() => responder(c.id, "recusar")}
                      className="flex-1 bg-red-50 text-red-600 border border-red-100 rounded-xl py-2.5 text-xs font-semibold active:opacity-80 transition-opacity">
                      Recusar
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-gray-300 mt-2">Recebido em {new Date(c.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
