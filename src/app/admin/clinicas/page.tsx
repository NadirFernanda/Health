"use client";
import { useEffect, useState } from "react";
import { Check, X, Star, MessageCircle, MapPin, Ban, RotateCcw } from "lucide-react";

type EstadoVerificacao = "APROVADO" | "PENDENTE" | "REJEITADO" | "SUSPENSO";
type Filtro = "TODOS" | "PENDENTE" | "APROVADO" | "REJEITADO" | "SUSPENSO";

type Clinica = {
  id: string; nome: string; email: string; morada: string; zonaLuanda: string;
  contacto: string; alvara: string; rating: number; totalAvaliacoes: number;
  totalPlantoes: number; totalSalas: number; verified: boolean;
  estadoVerificacao: EstadoVerificacao; criadoEm: string;
};

const badgeMap: Record<EstadoVerificacao, { cls: string; label: string }> = {
  APROVADO:  { cls: "bg-green-100 text-green-700",   label: "Verificada" },
  PENDENTE:  { cls: "bg-yellow-100 text-yellow-700", label: "Pendente"   },
  REJEITADO: { cls: "bg-red-100 text-red-600",       label: "Rejeitada"  },
  SUSPENSO:  { cls: "bg-gray-100 text-gray-500",     label: "Suspensa"   },
};

export default function AdminClinicas() {
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [lista, setLista]   = useState<Clinica[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/clinicas")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setLista(d); })
      .finally(() => setLoading(false));
  }, []);

  const acao = async (id: string, a: string) => {
    await fetch(`/api/admin/clinicas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: a }),
    });
    setLista((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      if (a === "APROVAR")   return { ...c, verified: true,  estadoVerificacao: "APROVADO" as const };
      if (a === "REJEITAR")  return { ...c, verified: false, estadoVerificacao: "REJEITADO" as const };
      if (a === "SUSPENDER") return { ...c, estadoVerificacao: "SUSPENSO" as const };
      if (a === "REATIVAR")  return { ...c, estadoVerificacao: "APROVADO" as const };
      return c;
    }));
  };

  const filtered = filtro === "TODOS" ? lista : lista.filter((c) => c.estadoVerificacao === filtro);
  const count = (f: Filtro) =>
    f === "TODOS" ? lista.length : lista.filter((c) => c.estadoVerificacao === f).length;

  if (loading) return (
    <div className="p-4 pt-10 flex justify-center">
      <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 space-y-4 pb-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900">Gestão de Clínicas</h1>
        <span className="bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">{lista.length} total</span>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(["TODOS", "PENDENTE", "APROVADO", "REJEITADO", "SUSPENSO"] as Filtro[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filtro === f ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()} ({count(f)})
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start gap-3">
              {/* Ícone */}
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center font-bold text-green-700 text-xl shrink-0">
                {c.nome.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-gray-900">{c.nome}</p>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeMap[c.estadoVerificacao].cls}`}>
                    {badgeMap[c.estadoVerificacao].label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <MapPin size={11} strokeWidth={1.75} />
                  {c.morada || c.zonaLuanda || "—"}
                </p>
                <p className="text-xs text-gray-400">{c.email}</p>
                <p className="text-xs text-gray-300 mt-0.5">
                  Cadastro: {new Date(c.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Estatísticas (se já tem avaliações) */}
            {c.totalAvaliacoes > 0 && (
              <div className="flex gap-4 mt-3 pt-2.5 border-t border-gray-50">
                <span className="flex items-center gap-1 text-xs text-gray-500"><Star size={11} strokeWidth={1.75} /> {c.rating}</span>
                <span className="flex items-center gap-1 text-xs text-gray-500"><MessageCircle size={11} strokeWidth={1.75} /> {c.totalAvaliacoes} avaliações</span>
              </div>
            )}

            {/* Acções */}
            {c.estadoVerificacao === "PENDENTE" && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => acao(c.id, "APROVAR")}
                  className="flex-1 bg-[#00A99D] hover:bg-[#009082] text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <Check size={13} strokeWidth={2.5} /> APROVAR
                </button>
                <button
                  onClick={() => acao(c.id, "REJEITAR")}
                  className="flex-1 border border-red-200 hover:bg-red-50 text-red-500 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <X size={13} strokeWidth={2.5} /> REJEITAR
                </button>
              </div>
            )}
            {c.estadoVerificacao === "APROVADO" && (
              <button
                onClick={() => acao(c.id, "SUSPENDER")}
                className="mt-2.5 w-full border border-gray-200 text-gray-400 hover:bg-gray-50 text-xs font-medium py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <Ban size={13} strokeWidth={2} /> Suspender Clínica
              </button>
            )}
            {c.estadoVerificacao === "SUSPENSO" && (
              <button
                onClick={() => acao(c.id, "REATIVAR")}
                className="mt-2.5 w-full bg-[#0B3C74]/10 hover:bg-[#0B3C74]/20 text-[#0B3C74] text-xs font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <RotateCcw size={13} strokeWidth={2} /> Reactivar Clínica
              </button>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
            Nenhuma clínica com este filtro.
          </div>
        )}
      </div>
    </div>
  );
}
