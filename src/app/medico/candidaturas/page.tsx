"use client";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/nav";
import Link from "next/link";
import { Calendar, Clock, Banknote, ChevronRight } from "lucide-react";

type Candidatura = {
  id: string;
  estado: string;
  criadoEm: string;
  plantao: {
    id: string;
    especialidade: string;
    dataInicio: string;
    dataFim: string;
    valorKwanzas: number;
    clinica: { nome: string } | null;
    profissionalPublicador: { nome: string } | null;
  };
};

type Filtro = "TODOS" | "PENDENTE" | "ACEITE" | "RECUSADO";

const estadoBadge: Record<string, { cls: string; label: string }> = {
  PENDENTE:  { cls: "bg-yellow-100 text-yellow-700", label: "Pendente" },
  ACEITE:    { cls: "bg-green-100 text-green-700",   label: "Aceite" },
  RECUSADO:  { cls: "bg-red-100 text-red-600",       label: "Recusado" },
};

function formatData(d: string) {
  return new Date(d).toLocaleDateString("pt-AO", { weekday: "short", day: "2-digit", month: "short" });
}
function formatHora(d: string) {
  return new Date(d).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
}
function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

export default function MinhasCandidaturas() {
  const [lista, setLista] = useState<Candidatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("TODOS");

  useEffect(() => {
    fetch("/api/medico/candidaturas", { credentials: "include" })
      .then(async (r) => {
        const body = await r.json().catch(() => []);
        if (!r.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${r.status}`);
        return body as Candidatura[];
      })
      .then(setLista)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filtro === "TODOS" ? lista : lista.filter((c) => c.estado === filtro);
  const count = (f: Filtro) => f === "TODOS" ? lista.length : lista.filter((c) => c.estado === f).length;

  return (
    <div>
      <TopBar titulo="As Minhas Candidaturas" back="/medico" />

      <div className="px-4 pt-4 space-y-4 pb-10">

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(["TODOS", "PENDENTE", "ACEITE", "RECUSADO"] as Filtro[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filtro === f ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "TODOS" ? "Todos" : f.charAt(0) + f.slice(1).toLowerCase()} ({count(f)})
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center pt-10">
            <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl p-4 text-center">{error}</div>
        )}

        {/* List */}
        {!loading && !error && (
          <div className="space-y-3">
            {filtered.map((c) => {
              const badge = estadoBadge[c.estado] ?? { cls: "bg-gray-100 text-gray-500", label: c.estado };
              const entidade = c.plantao.clinica?.nome ?? c.plantao.profissionalPublicador?.nome ?? "Plantão";
              return (
                <Link
                  key={c.id}
                  href={`/medico/plantoes/${c.plantao.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-4 active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 truncate">{entidade}</p>
                        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{c.plantao.especialidade}</p>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} strokeWidth={1.75} />
                          {formatData(c.plantao.dataInicio)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} strokeWidth={1.75} />
                          {formatHora(c.plantao.dataInicio)} – {formatHora(c.plantao.dataFim)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Banknote size={11} strokeWidth={1.75} />
                          {formatAOA(c.plantao.valorKwanzas)}
                        </span>
                      </div>

                      <p className="text-[10px] text-gray-300 mt-1.5">
                        Candidatura: {new Date(c.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <ChevronRight size={16} strokeWidth={1.75} className="text-gray-300 shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-14 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
                {filtro === "TODOS" ? "Ainda não tens candidaturas." : `Nenhuma candidatura com estado "${filtro.toLowerCase()}".`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
