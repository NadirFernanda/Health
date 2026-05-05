"use client";
import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/nav";
import Link from "next/link";
import { Star, BadgeCheck, Search, MapPin, Zap } from "lucide-react";

type Medico = {
  id: string; nome: string; tipo: string; especialidade: string;
  subEspecialidade: string | null; provincia: string; cidade: string | null;
  foto: string | null; rating: number; totalAvaliacoes: number;
  totalPlantoes: number; verified: boolean; anosExperiencia: number | null;
  disponivelAgora: boolean;
};

export default function ClinicaMedicos() {
  const [lista, setLista] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [verificado, setVerificado] = useState(false);
  const [disponivel, setDisponivel] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (verificado) p.set("verificado", "true");
      if (disponivel) p.set("disponivel", "true");
      const res = await fetch(`/api/clinica/medicos?${p}`, { credentials: "include" });
      const data = await res.json().catch(() => []);
      if (Array.isArray(data)) setLista(data);
    } finally {
      setLoading(false);
    }
  }, [q, verificado, disponivel]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  return (
    <div className="pb-28">
      <TopBar titulo="Médicos Disponíveis" back="/clinica" />

      <div className="px-4 pt-4 space-y-3">

        {/* Pesquisa */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={2} />
          <input
            type="text"
            placeholder="Nome, especialidade, cidade..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0B3C74]"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <button
            onClick={() => setVerificado((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              verificado ? "bg-[#00A99D] text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            <BadgeCheck size={12} strokeWidth={2} /> Verificados
          </button>
          <button
            onClick={() => setDisponivel((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              disponivel ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            <Zap size={12} strokeWidth={2} /> Disponível agora
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center pt-10">
            <div className="w-7 h-7 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Lista */}
        {!loading && (
          <div className="space-y-3">
            {lista.map((m) => {
              const iniciais = m.nome.trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
              return (
                <Link
                  key={m.id}
                  href={`/clinica/medicos/${m.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-4 active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-[#0B3C74] text-lg shrink-0">
                      {m.foto
                        ? <img src={m.foto} alt={m.nome} className="w-12 h-12 rounded-xl object-cover" />
                        : iniciais}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-sm text-gray-900 truncate">{m.nome}</p>
                        {m.verified && <BadgeCheck size={13} strokeWidth={2} className="text-[#00A99D] shrink-0" />}
                        {m.disponivelAgora && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">Disponível</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{m.especialidade}{m.subEspecialidade ? ` · ${m.subEspecialidade}` : ""}</p>
                      {(m.cidade || m.provincia) && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <MapPin size={10} strokeWidth={1.75} className="shrink-0" />
                          {m.cidade ? `${m.cidade}, ` : ""}{m.provincia}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-0.5 text-yellow-500">
                          <Star size={11} strokeWidth={1.75} fill="currentColor" />
                          {m.rating.toFixed(1)}
                          <span className="text-gray-400 ml-0.5">({m.totalAvaliacoes})</span>
                        </span>
                        <span>{m.totalPlantoes} plantões</span>
                        {m.anosExperiencia && <span>{m.anosExperiencia}a exp.</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {lista.length === 0 && (
              <div className="text-center py-14 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
                Nenhum médico encontrado com esses critérios.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
