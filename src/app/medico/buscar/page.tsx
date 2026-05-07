"use client";
import { useState, useEffect, useRef } from "react";
import { PlantaoCard } from "@/components/plantao-card";
import { TopBar } from "@/components/nav";
import { EmptyState } from "@/components/empty-state";
import { Search, AlertCircle, Sparkles } from "lucide-react";

type PlantaoAPI = {
  id: string; tipoProfissional: string; especialidade: string; dataInicio: string; dataFim: string;
  valorKwanzas: number; vagas: number; vagasPreenchidas: number; estado: string;
  descricao: string; clinica: { id: string; nome: string; morada: string; cidade: string; provincia: string; logo: string; rating: number; totalAvaliacoes: number; verified: boolean };
  equipamentos: Record<string, boolean>;
};

const tiposProfissional = [
  { value: "Todos", label: "Todos" },
  { value: "MEDICO", label: "Médico" },
  { value: "ENFERMEIRO", label: "Enfermeiro" },
  { value: "TECNICO_SAUDE", label: "Técnico Saúde" },
];

const especialidades = [
  "Medicina Geral", "Pediatria", "Ginecologia", "Cardiologia",
  "Cirurgia", "Ortopedia", "Dermatologia", "Psiquiatria",
  "Enfermagem Geral", "Enfermagem de Urgência",
  "Técnico de Análises Clínicas", "Técnico de Radiologia",
];

const zonas = [
  "Centralidade Horizonte", "Talatona", "Miramar", "Alvalade", "Kilamba",
  "Maianga", "Ingombota", "Rangel", "Cazenga", "Viana", "Cacuaco",
];

const VALOR_MAX: Record<string, number | undefined> = {
  todos: undefined,
  ate15: 15000,
  "15a20": 20000,
  mais20: undefined,
};

const VALOR_MIN: Record<string, number | undefined> = {
  todos: undefined,
  ate15: undefined,
  "15a20": 15001,
  mais20: 20001,
};

const DURACAO_FILTROS = [
  { key: "todas", label: "Todas" },
  { key: "ate4", label: "≤ 4h" },
  { key: "4a8", label: "4–8h" },
  { key: "mais8", label: "> 8h" },
];

function getDuracaoHoras(dataInicio: string, dataFim: string): number {
  return (new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60);
}

export default function BuscarPlantoes() {
  const [plantoes, setPlantoes] = useState<PlantaoAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroEsp, setFiltroEsp] = useState<string>("Todas");
  const [filtroTipo, setFiltroTipo] = useState<string>("Todos");
  const [filtroValor, setFiltroValor] = useState<string>("todos");
  const [filtroZona, setFiltroZona] = useState<string>("Todas");
  const [filtroDuracao, setFiltroDuracao] = useState<string>("todas");
  const [disponivelAgora, setDisponivelAgora] = useState(false);
  const [sugestoes, setSugestoes] = useState<PlantaoAPI[]>([]);
  const [loadingSugestoes, setLoadingSugestoes] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/plantoes/sugestoes")
      .then((r) => r.ok ? r.json() : { sugestoes: [] })
      .then((d) => setSugestoes(d.sugestoes ?? []))
      .catch(() => {})
      .finally(() => setLoadingSugestoes(false));
  }, []);

  useEffect(() => {
    // Cancelar fetch anterior para evitar race conditions
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setErro(null);

    const params = new URLSearchParams();
    if (filtroEsp !== "Todas") params.set("especialidade", filtroEsp);
    if (filtroTipo !== "Todos") params.set("tipoProfissional", filtroTipo);
    if (filtroZona !== "Todas") params.set("zona", filtroZona);
    if (disponivelAgora) params.set("disponivelAgora", "true");

    const maxValor = VALOR_MAX[filtroValor];
    const minValor = VALOR_MIN[filtroValor];
    if (maxValor !== undefined) params.set("valorMax", String(maxValor));
    if (minValor !== undefined) params.set("valorMin", String(minValor));

    fetch(`/api/plantoes?${params}`, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Erro ${r.status}`);
        return r.json();
      })
      .then((d) => {
        // Suporta formato paginado { plantoes, paginacao } ou array legado
        const lista = Array.isArray(d) ? d : (d.plantoes ?? []);
        setPlantoes(lista);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        setErro("Não foi possível carregar os plantões. Tenta novamente.");
        setLoading(false);
      });

    return () => ctrl.abort();
  }, [filtroEsp, filtroTipo, filtroZona, disponivelAgora, filtroValor]);

  const plantoesFiltrados = filtroDuracao === "todas" ? plantoes : plantoes.filter((p) => {
    const h = getDuracaoHoras(p.dataInicio, p.dataFim);
    if (filtroDuracao === "ate4") return h <= 4;
    if (filtroDuracao === "4a8") return h > 4 && h <= 8;
    return h > 8; // mais8
  });

  return (
    <div>
      <TopBar titulo="Buscar Plantões" back="/medico" />

      {/* Sugeridos para Si */}
      {(loadingSugestoes || sugestoes.length > 0) && (
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} strokeWidth={2} className="text-[#00A99D]" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sugeridos para Si</p>
          </div>
          {loadingSugestoes ? (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {[1, 2].map((i) => (
                <div key={i} className="shrink-0 w-64 bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {sugestoes.map((p) => (
                <div key={p.id} className="shrink-0 w-72">
                  <PlantaoCard plantao={p as never} showCandidatarBtn />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toggle Disponível Agora */}
      <div className="mx-4 mt-4 flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-4 py-3">
        <div>
          <p className="text-sm font-bold text-gray-800">Disponível Agora</p>
          <p className="text-xs text-gray-400">Turnos que começam nas próximas 4h</p>
        </div>
        <button
          onClick={() => setDisponivelAgora((v) => !v)}
          className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${disponivelAgora ? "bg-[#0B3C74]" : "bg-gray-200"}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${disponivelAgora ? "left-6" : "left-0.5"}`} />
        </button>
      </div>

      {/* Filtro tipo profissional */}
      <div className="px-4 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo de Profissional</p>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {tiposProfissional.map((t) => (
            <button
              key={t.value}
              onClick={() => setFiltroTipo(t.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filtroTipo === t.value
                  ? "bg-[#0B3C74] text-white border-[#0B3C74]"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro zona */}
      <div className="px-4 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Zona</p>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {["Todas", ...zonas].map((z) => (
            <button
              key={z}
              onClick={() => setFiltroZona(z)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filtroZona === z
                  ? "bg-[#0B3C74] text-white border-[#0B3C74]"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro especialidade */}
      <div className="px-4 pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Especialidade</p>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {["Todas", ...especialidades].map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEsp(e)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filtroEsp === e
                  ? "bg-[#0B3C74] text-white border-[#0B3C74]"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro valor */}
      <div className="px-4 pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Valor</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "todos", label: "Todos" },
            { key: "ate15", label: "Até 15.000 AOA" },
            { key: "15a20", label: "15–20k AOA" },
            { key: "mais20", label: "Acima de 20k" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltroValor(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filtroValor === f.key
                  ? "bg-[#0B3C74] text-white border-[#0B3C74]"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro duração */}
      <div className="px-4 pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Duração</p>
        <div className="flex gap-2 flex-wrap">
          {DURACAO_FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltroDuracao(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filtroDuracao === f.key
                  ? "bg-[#0B3C74] text-white border-[#0B3C74]"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resultados */}
      <div className="px-4 pt-4 pb-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : erro ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <AlertCircle className="text-red-400" size={40} />
            <p className="text-sm text-gray-600">{erro}</p>
            <button
              onClick={() => setFiltroEsp(filtroEsp)}
              className="px-4 py-2 bg-[#0B3C74] text-white rounded-full text-sm font-semibold"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-3">{plantoesFiltrados.length} plantão(ões) encontrado(s)</p>
            <div className="space-y-3">
              {plantoesFiltrados.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="Nenhum plantão encontrado"
                  description="Nenhum turno na sua zona agora. Novas publicações chegam todos os dias!"
                  actionLabel="Activar alertas"
                  actionHref="/medico/notificacoes"
                />
              ) : (
                plantoesFiltrados.map((p) => (
                  <PlantaoCard key={p.id} plantao={p as never} showCandidatarBtn />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
