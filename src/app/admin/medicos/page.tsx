"use client";
import { adminMedicosMock, AdminMedico, EstadoVerificacao } from "@/lib/mock-data";
import { useState } from "react";

type Filtro = "TODOS" | "PENDENTE" | "APROVADO" | "REJEITADO" | "SUSPENSO";

const badgeMap: Record<EstadoVerificacao, { cls: string; label: string }> = {
  APROVADO:  { cls: "bg-green-100 text-green-700",  label: "✓ Verificado" },
  PENDENTE:  { cls: "bg-yellow-100 text-yellow-700", label: "⏳ Pendente"  },
  REJEITADO: { cls: "bg-red-100 text-red-600",       label: "✗ Rejeitado"  },
  SUSPENSO:  { cls: "bg-gray-100 text-gray-500",     label: "⊘ Suspenso"   },
};

export default function AdminMedicos() {
  const [filtro, setFiltro]   = useState<Filtro>("TODOS");
  const [lista,  setLista]    = useState<AdminMedico[]>(adminMedicosMock);

  const filtered = filtro === "TODOS" ? lista : lista.filter((m) => m.estadoVerificacao === filtro);

  const count = (f: Filtro) =>
    f === "TODOS" ? lista.length : lista.filter((m) => m.estadoVerificacao === f).length;

  const update = (id: string, estado: EstadoVerificacao) =>
    setLista((prev) => prev.map((m) => (m.id === id ? { ...m, estadoVerificacao: estado } : m)));

  return (
    <div className="p-4 space-y-4 pb-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900">Gestão de Médicos</h1>
        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{lista.length} total</span>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(["TODOS", "PENDENTE", "APROVADO", "REJEITADO", "SUSPENSO"] as Filtro[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filtro === f ? "bg-[#1A6FBB] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()} ({count(f)})
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.map((m) => (
          <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-[#1A6FBB] text-lg shrink-0">
                {m.nome.split(" ")[1]?.charAt(0) ?? m.nome.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-gray-900">{m.nome}</p>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeMap[m.estadoVerificacao].cls}`}>
                    {badgeMap[m.estadoVerificacao].label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{m.especialidade} · {m.provincia}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{m.numeroOrdem}</p>
                <p className="text-xs text-gray-400">{m.email}</p>
                <p className="text-xs text-gray-300 mt-0.5">
                  Cadastro: {new Date(m.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Estatísticas (se já fez plantões) */}
            {m.totalPlantoes > 0 && (
              <div className="flex gap-4 mt-3 pt-2.5 border-t border-gray-50">
                <span className="text-xs text-gray-500">⭐ {m.rating}</span>
                <span className="text-xs text-gray-500">📋 {m.totalPlantoes} plantões</span>
                <span className="text-xs text-gray-500">💬 {m.totalAvaliacoes} avaliações</span>
              </div>
            )}

            {/* Acções */}
            {m.estadoVerificacao === "PENDENTE" && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => update(m.id, "APROVADO")}
                  className="flex-1 bg-[#27AE60] hover:bg-[#1A7A42] text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  ✓ APROVAR
                </button>
                <button
                  onClick={() => update(m.id, "REJEITADO")}
                  className="flex-1 border border-red-200 hover:bg-red-50 text-red-500 text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  ✗ REJEITAR
                </button>
              </div>
            )}
            {m.estadoVerificacao === "APROVADO" && (
              <button
                onClick={() => update(m.id, "SUSPENSO")}
                className="mt-2.5 w-full border border-gray-200 text-gray-400 hover:bg-gray-50 text-xs font-medium py-2 rounded-xl transition-colors"
              >
                ⊘ Suspender Acesso
              </button>
            )}
            {m.estadoVerificacao === "SUSPENSO" && (
              <button
                onClick={() => update(m.id, "APROVADO")}
                className="mt-2.5 w-full bg-[#1A6FBB]/10 hover:bg-[#1A6FBB]/20 text-[#1A6FBB] text-xs font-semibold py-2 rounded-xl transition-colors"
              >
                ↺ Reactivar Acesso
              </button>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
            Nenhum médico com este filtro.
          </div>
        )}
      </div>
    </div>
  );
}
