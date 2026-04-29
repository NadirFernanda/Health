"use client";
import { plantoesMock, plantoesDaClinica, formatAOA, formatData, formatHora } from "@/lib/mock-data";
import { useState } from "react";

const todosPlantoes = [...plantoesMock, ...plantoesDaClinica];

type EstadoFiltro = "TODOS" | "ABERTO" | "CONCLUIDO" | "CANCELADO" | "EM_ANDAMENTO";

const estadoLabel: Record<string, { cls: string; label: string }> = {
  ABERTO:        { cls: "bg-green-100 text-green-700",  label: "Aberto"       },
  FECHADO:       { cls: "bg-blue-100 text-blue-700",    label: "Fechado"      },
  EM_ANDAMENTO:  { cls: "bg-yellow-100 text-yellow-700", label: "Em andamento" },
  CONCLUIDO:     { cls: "bg-gray-100 text-gray-600",    label: "Concluído"    },
  CANCELADO:     { cls: "bg-red-100 text-red-600",      label: "Cancelado"    },
};

export default function AdminPlantoes() {
  const [filtro, setFiltro] = useState<EstadoFiltro>("TODOS");
  const [busca,  setBusca]  = useState("");

  const lista = todosPlantoes.filter((p) => {
    const matchEstado = filtro === "TODOS" || p.estado === filtro;
    const matchBusca  = busca === "" ||
      p.especialidade.toLowerCase().includes(busca.toLowerCase()) ||
      p.clinica.nome.toLowerCase().includes(busca.toLowerCase());
    return matchEstado && matchBusca;
  });

  const count = (f: EstadoFiltro) =>
    f === "TODOS"
      ? todosPlantoes.length
      : todosPlantoes.filter((p) => p.estado === f).length;

  const totalValor = lista.reduce((s, p) => s + p.valorKwanzas, 0);
  const totalComissao = Math.round(totalValor * 0.1);

  return (
    <div className="p-4 space-y-4 pb-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900">Gestão de Plantões</h1>
        <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">{todosPlantoes.length} total</span>
      </div>

      {/* Busca */}
      <input
        type="text"
        placeholder="Buscar por especialidade ou clínica..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0B3C74] bg-white"
      />

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(["TODOS", "ABERTO", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"] as EstadoFiltro[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filtro === f ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "EM_ANDAMENTO" ? "Em andamento" : f.charAt(0) + f.slice(1).toLowerCase()} ({count(f)})
          </button>
        ))}
      </div>

      {/* Resumo financeiro */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-xs text-gray-400 uppercase font-bold tracking-wide mb-3">Resumo ({lista.length} plantões)</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-sm font-bold text-gray-900">{formatAOA(totalValor)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Valor total</p>
          </div>
          <div>
            <p className="text-sm font-bold text-[#00A99D]">{formatAOA(totalValor - totalComissao)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Pago médicos</p>
          </div>
          <div>
            <p className="text-sm font-bold text-purple-600">{formatAOA(totalComissao)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Comissão Planto</p>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {lista.map((p) => {
          const badge = estadoLabel[p.estado] ?? { cls: "bg-gray-100 text-gray-600", label: p.estado };
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-900">{p.especialidade}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                    <span className="font-medium text-gray-700">{p.clinica.nome}</span>
                    <span className="text-gray-300">·</span>
                    {p.clinica.cidade}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatData(p.dataInicio)} · {formatHora(p.dataInicio)} – {formatHora(p.dataFim)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#0B3C74]">{formatAOA(p.valorKwanzas)}</p>
                  <p className="text-xs text-gray-400">{p.vagas} vaga(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2.5 pt-2.5 border-t border-gray-50">
                <span className="text-xs text-gray-500">{p.candidatos ?? 0} candidato(s)</span>
                <span className="text-xs text-gray-500">comissão: {formatAOA(Math.round(p.valorKwanzas * 0.1))}</span>
                <span className="text-xs font-mono text-gray-300 ml-auto">{p.id}</span>
              </div>
            </div>
          );
        })}

        {lista.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
            Nenhum plantão encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
