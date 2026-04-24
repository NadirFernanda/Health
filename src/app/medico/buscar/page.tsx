"use client";
import { useState } from "react";
import { plantoesMock, Especialidade, ZonaLuanda } from "@/lib/mock-data";
import { PlantaoCard } from "@/components/plantao-card";
import { TopBar } from "@/components/nav";

const especialidades: Especialidade[] = [
  "Medicina Geral", "Pediatria", "Ginecologia", "Cardiologia",
  "Cirurgia", "Ortopedia", "Dermatologia", "Psiquiatria",
  "Enfermagem Geral", "Enfermagem de Urgência",
  "Técnico de Análises Clínicas", "Técnico de Radiologia",
];

const zonas: ZonaLuanda[] = ["Centralidade Horizonte", "Talatona", "Miramar", "Alvalade", "Kilamba"];

export default function BuscarPlantoes() {
  const [filtroEsp, setFiltroEsp] = useState<string>("Todas");
  const [filtroValor, setFiltroValor] = useState<string>("todos");
  const [filtroZona, setFiltroZona] = useState<string>("Todas");
  const [disponivelAgora, setDisponivelAgora] = useState(false);

  const agora = new Date();

  const plantoesFiltrados = plantoesMock.filter((p) => {
    const espOk = filtroEsp === "Todas" || p.especialidade === filtroEsp;
    const valorOk =
      filtroValor === "todos" ||
      (filtroValor === "ate15" && p.valorKwanzas <= 15000) ||
      (filtroValor === "15a20" && p.valorKwanzas > 15000 && p.valorKwanzas <= 20000) ||
      (filtroValor === "mais20" && p.valorKwanzas > 20000);
    // Zona: comparamos a cidade da clínica vs zona (mock simplificado)
    const zonaOk = filtroZona === "Todas" || p.clinica.cidade.includes(filtroZona) || filtroZona === "Centralidade Horizonte";
    // Disponível agora: turno que começa nas próximas 4h
    const inicio = new Date(p.dataInicio);
    const dispOk = !disponivelAgora || (inicio.getTime() - agora.getTime() < 4 * 60 * 60 * 1000 && inicio > agora);
    return espOk && valorOk && zonaOk && p.estado === "ABERTO" && (!disponivelAgora || dispOk);
  });

  return (
    <div>
      <TopBar titulo="Buscar Plantões" />

      {/* Toggle Disponível Agora */}
      <div className="mx-4 mt-4 flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-4 py-3">
        <div>
          <p className="text-sm font-bold text-gray-800">Disponível Agora</p>
          <p className="text-xs text-gray-400">Turnos que começam nas próximas 4h</p>
        </div>
        <button
          onClick={() => setDisponivelAgora((v) => !v)}
          className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${disponivelAgora ? "bg-brand-500" : "bg-gray-200"}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${disponivelAgora ? "left-6" : "left-0.5"}`} />
        </button>
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
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">🔍</p>
              <p className="text-sm">Nenhum plantão encontrado com estes filtros.</p>
            </div>
          ) : (
            plantoesFiltrados.map((p) => (
              <PlantaoCard key={p.id} plantao={p} showCandidatarBtn />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
