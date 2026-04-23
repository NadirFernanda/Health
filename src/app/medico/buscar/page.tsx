"use client";
import { useState } from "react";
import { plantoesMock, Especialidade } from "@/lib/mock-data";
import { PlantaoCard } from "@/components/plantao-card";
import { TopBar } from "@/components/nav";

const especialidades: Especialidade[] = [
  "Medicina Geral", "Pediatria", "Ginecologia", "Cardiologia",
  "Cirurgia", "Ortopedia", "Dermatologia", "Psiquiatria",
];

export default function BuscarPlantoes() {
  const [filtroEsp, setFiltroEsp] = useState<string>("Todas");
  const [filtroValor, setFiltroValor] = useState<string>("todos");

  const plantoesFiltrados = plantoesMock.filter((p) => {
    const espOk = filtroEsp === "Todas" || p.especialidade === filtroEsp;
    const valorOk =
      filtroValor === "todos" ||
      (filtroValor === "ate15" && p.valorKwanzas <= 15000) ||
      (filtroValor === "15a20" && p.valorKwanzas > 15000 && p.valorKwanzas <= 20000) ||
      (filtroValor === "mais20" && p.valorKwanzas > 20000);
    return espOk && valorOk && p.estado === "ABERTO";
  });

  return (
    <div>
      <TopBar titulo="Buscar Plantões" />

      {/* Filtro especialidade */}
      <div className="px-4 pt-4">
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
      <div className="px-4 pt-4">
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
