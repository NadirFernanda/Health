"use client";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/nav";
import { EmptyState } from "@/components/empty-state";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Banknote, Users, Stethoscope } from "lucide-react";

type MeuPlantao = {
  id: string;
  especialidade: string;
  tipoProfissional: string;
  dataInicio: string;
  dataFim: string;
  valorKwanzas: number;
  vagas: number;
  vagasPreenchidas: number;
  estado: string;
  descricao: string | null;
  candidaturas: number;
};

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

function formatData(d: string) {
  return new Date(d).toLocaleDateString("pt-AO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatHora(d: string) {
  return new Date(d).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
}

const estadoMap: Record<string, { label: string; cls: string }> = {
  ABERTO:    { label: "Aberto",    cls: "bg-green-50 text-green-700" },
  FECHADO:   { label: "Fechado",   cls: "bg-gray-100 text-gray-600" },
  CANCELADO: { label: "Cancelado", cls: "bg-red-50 text-red-600" },
  CONCLUIDO: { label: "Concluído", cls: "bg-blue-50 text-blue-700" },
};

type FiltroEstado = "TODOS" | "ABERTO" | "FECHADO" | "CONCLUIDO" | "CANCELADO";

export default function MeusPlantoes() {
  const router = useRouter();
  const [plantoes, setPlantoes] = useState<MeuPlantao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroEstado>("TODOS");

  useEffect(() => {
    fetch("/api/medico/publicar")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (Array.isArray(d)) setPlantoes(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtrados =
    filtro === "TODOS" ? plantoes : plantoes.filter((p) => p.estado === filtro);

  return (
    <div>
      <TopBar titulo="Meus Plantões Publicados" back="/medico" />

      {/* Filtros */}
      <div className="px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(["TODOS", "ABERTO", "FECHADO", "CONCLUIDO", "CANCELADO"] as FiltroEstado[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filtro === f ? "bg-[#1A6FBB] text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {f === "TODOS" ? "Todos" : (estadoMap[f]?.label ?? f)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="px-4 pt-4 pb-24 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">A carregar...</div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="Nenhum plantão publicado"
            description="Ainda não publicaste nenhuma vaga de substituto."
            actionLabel="Publicar plantão"
            actionHref="/medico/publicar-plantao"
          />
        ) : (
          filtrados.map((p) => {
            const estado = estadoMap[p.estado] ?? { label: p.estado, cls: "bg-gray-100 text-gray-600" };
            const vagasLivres = p.vagas - p.vagasPreenchidas;
            return (
              <button
                key={p.id}
                onClick={() => router.push(`/medico/plantoes/${p.id}`)}
                className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform"
              >
                {/* Cabeçalho */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope size={16} strokeWidth={1.75} className="text-[#1A6FBB]" />
                    <span className="font-bold text-gray-900 text-sm">{p.especialidade}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${estado.cls}`}>
                    {estado.label}
                  </span>
                </div>

                {/* Detalhes */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={13} strokeWidth={1.75} />
                    <span>{formatData(p.dataInicio)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={13} strokeWidth={1.75} />
                    <span>{formatHora(p.dataInicio)} – {formatHora(p.dataFim)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Banknote size={13} strokeWidth={1.75} />
                    <span className="font-semibold text-[#1A6FBB]">{formatAOA(p.valorKwanzas)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users size={13} strokeWidth={1.75} />
                    <span>{vagasLivres} vaga(s) disponível(eis) · {p.candidaturas} candidatura(s)</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
