"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle, Clock, ChevronRight, Search } from "lucide-react";
import Link from "next/link";

type Filtro = "TODAS" | "ABERTA" | "EM_ANALISE" | "RESOLVIDA" | "ENCERRADA";

interface DisputaItem {
  id: string;
  tipo: string;
  estado: string;
  medicoNome: string;
  clinicaNome: string;
  especialidade: string;
  valorKwanzas: number;
  plantaoData: string;
  criadoEm: string;
  ajusteValorKz?: number;
  iniciadoPorRole: string;
}

const TIPO_LABELS: Record<string, string> = {
  NAO_COMPARECEU: "Não compareceu",
  NAO_PAGOU: "Não pagou",
  QUALIDADE: "Qualidade",
  CANCELAMENTO: "Cancelamento",
  OUTRO: "Outro",
};

const ESTADO_MAP: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  ABERTA:     { label: "Aberta",     cls: "bg-yellow-100 text-yellow-700", icon: <Clock size={11} strokeWidth={2} /> },
  EM_ANALISE: { label: "Em análise", cls: "bg-blue-100 text-blue-700",     icon: <AlertTriangle size={11} strokeWidth={2} /> },
  RESOLVIDA:  { label: "Resolvida",  cls: "bg-green-100 text-green-700",   icon: <CheckCircle2 size={11} strokeWidth={2} /> },
  ENCERRADA:  { label: "Encerrada",  cls: "bg-gray-100 text-gray-500",     icon: <XCircle size={11} strokeWidth={2} /> },
};

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

export default function AdminDisputasPage() {
  const [disputas, setDisputas] = useState<DisputaItem[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("TODAS");
  const [pesquisa, setPesquisa] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/disputas")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setDisputas(d); })
      .finally(() => setLoading(false));
  }, []);

  const filtros: { value: Filtro; label: string }[] = [
    { value: "TODAS",      label: "Todas" },
    { value: "ABERTA",     label: "Abertas" },
    { value: "EM_ANALISE", label: "Em análise" },
    { value: "RESOLVIDA",  label: "Resolvidas" },
    { value: "ENCERRADA",  label: "Encerradas" },
  ];

  const q = pesquisa.toLowerCase();
  const filtered = disputas.filter((d) => {
    const matchStatus = filtro === "TODAS" || d.estado === filtro;
    const matchSearch = !q ||
      d.medicoNome.toLowerCase().includes(q) ||
      d.clinicaNome.toLowerCase().includes(q) ||
      d.especialidade.toLowerCase().includes(q) ||
      (TIPO_LABELS[d.tipo] ?? d.tipo).toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-4 space-y-4 pb-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-base font-bold text-gray-900">Disputas</h1>
        <span className="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">{disputas.length} total</span>
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {filtros.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filtro === f.value ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Pesquisa */}
      <div className="relative">
        <Search size={15} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Pesquisar por médico, clínica, especialidade…"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/20"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <AlertTriangle size={32} className="mx-auto mb-2 text-gray-300" strokeWidth={1.25} />
          <p className="text-sm">{pesquisa ? `Nenhum resultado para "${pesquisa}".` : "Nenhuma disputa encontrada."}</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((d) => {
          const est = ESTADO_MAP[d.estado] ?? ESTADO_MAP.ABERTA;
          return (
            <Link
              key={d.id}
              href={`/admin/disputas/${d.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-gray-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-900">{TIPO_LABELS[d.tipo] ?? d.tipo}</p>
                    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${est.cls}`}>
                      {est.icon} {est.label}
                    </span>
                    <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      Aberto por {d.iniciadoPorRole === "MEDICO" ? "médico" : "clínica"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5">
                    <span className="font-medium">{d.medicoNome}</span>
                    <span className="text-gray-400 mx-1">↔</span>
                    <span className="font-medium">{d.clinicaNome}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {d.especialidade} · {formatAOA(d.valorKwanzas)} ·{" "}
                    {new Date(d.plantaoData).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}
                  </p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Aberta em {new Date(d.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <ChevronRight size={16} strokeWidth={2} className="text-gray-300 shrink-0 mt-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
