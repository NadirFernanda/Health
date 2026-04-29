"use client";
import { useState, useEffect } from "react";
import { PlantaoCard } from "@/components/plantao-card";
import { TopBar } from "@/components/nav";
import { EmptyState } from "@/components/empty-state";
import { Search } from "lucide-react";

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

const zonas = ["Centralidade Horizonte", "Talatona", "Miramar", "Alvalade", "Kilamba"];

export default function BuscarPlantoes() {
  const [plantoes, setPlantoes] = useState<PlantaoAPI[]>([]);
  const [filtroEsp, setFiltroEsp] = useState<string>("Todas");
  const [filtroTipo, setFiltroTipo] = useState<string>("Todos");
  const [filtroValor, setFiltroValor] = useState<string>("todos");
  const [filtroZona, setFiltroZona] = useState<string>("Todas");
  const [disponivelAgora, setDisponivelAgora] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filtroEsp !== "Todas") params.set("especialidade", filtroEsp);
    if (filtroTipo !== "Todos") params.set("tipoProfissional", filtroTipo);
    if (filtroZona !== "Todas") params.set("zona", filtroZona);
    if (disponivelAgora) params.set("disponivelAgora", "true");
    fetch(`/api/plantoes?${params}`).then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setPlantoes(d);
    });
  }, [filtroEsp, filtroTipo, filtroZona, disponivelAgora]);

  const agora = new Date();
  const plantoesFiltrados = plantoes.filter((p) => {
    const valorOk =
      filtroValor === "todos" ||
      (filtroValor === "ate15" && p.valorKwanzas <= 15000) ||
      (filtroValor === "15a20" && p.valorKwanzas > 15000 && p.valorKwanzas <= 20000) ||
      (filtroValor === "mais20" && p.valorKwanzas > 20000);
    const inicio = new Date(p.dataInicio);
    const dispOk = !disponivelAgora || (inicio.getTime() - agora.getTime() < 4 * 60 * 60 * 1000 && inicio > agora);
    return valorOk && p.estado === "ABERTO" && (!disponivelAgora || dispOk);
  });

  return (
    <div>
      <TopBar titulo="Buscar Plantões" back="/medico" />

      {/* Toggle Disponível Agora */}
      <div className="mx-4 mt-4 flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-4 py-3">
        <div>
          <p className="text-sm font-bold text-gray-800">Disponível Agora</p>
          <p className="text-xs text-gray-400">Turnos que começam nas próximas 4h</p>
        </div>
        <button
          onClick={() => setDisponivelAgora((v) => !v)}
          className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${disponivelAgora ? "bg-[#1A6FBB]" : "bg-gray-200"}`}
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
                  ? "bg-[#1A6FBB] text-white border-[#1A6FBB]"
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
                  ? "bg-[#1A6FBB] text-white border-[#1A6FBB]"
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
                  ? "bg-[#1A6FBB] text-white border-[#1A6FBB]"
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
                  ? "bg-[#1A6FBB] text-white border-[#1A6FBB]"
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
      </div>
    </div>
  );
}
