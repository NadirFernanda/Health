"use client";
import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/nav";
import Link from "next/link";
import { Star, BadgeCheck, Search, MapPin, Zap, SlidersHorizontal, X, ChevronDown } from "lucide-react";

type Medico = {
  id: string; nome: string; tipo: string; especialidade: string;
  subEspecialidade: string | null; provincia: string; cidade: string | null;
  foto: string | null; rating: number; totalAvaliacoes: number;
  totalPlantoes: number; verified: boolean; anosExperiencia: number | null;
  disponivelAgora: boolean;
};

const TIPO_OPTS = [
  { value: "", label: "Todos" },
  { value: "MEDICO", label: "Médico" },
  { value: "ENFERMEIRO", label: "Enfermeiro" },
  { value: "TECNICO_SAUDE", label: "Técnico" },
];

const RATING_OPTS = [
  { value: 0, label: "Qualquer rating" },
  { value: 3, label: "3+ estrelas" },
  { value: 4, label: "4+ estrelas" },
  { value: 4.5, label: "4.5+ estrelas" },
];

const EXP_OPTS = [
  { value: 0, label: "Qualquer experiência" },
  { value: 1, label: "1+ anos" },
  { value: 3, label: "3+ anos" },
  { value: 5, label: "5+ anos" },
  { value: 10, label: "10+ anos" },
];

const ORDENAR_OPTS = [
  { value: "rating", label: "Melhor avaliados" },
  { value: "experiencia", label: "Mais experientes" },
  { value: "plantoes", label: "Mais plantões" },
  { value: "nome", label: "Nome (A-Z)" },
];

export default function ClinicaMedicos() {
  const [lista, setLista] = useState<Medico[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Meta
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [provincias, setProvincias] = useState<string[]>([]);

  // Filters
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [provincia, setProvincia] = useState("");
  const [verificado, setVerificado] = useState(false);
  const [disponivel, setDisponivel] = useState(false);
  const [ratingMin, setRatingMin] = useState(0);
  const [expMin, setExpMin] = useState(0);
  const [ordenar, setOrdenar] = useState("rating");

  // Load meta (specialties + provinces for dropdowns)
  useEffect(() => {
    fetch("/api/clinica/medicos?meta=1", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.especialidades) setEspecialidades(d.especialidades);
        if (d.provincias) setProvincias(d.provincias);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (tipo) p.set("tipo", tipo);
      if (especialidade) p.set("especialidade", especialidade);
      if (provincia) p.set("provincia", provincia);
      if (verificado) p.set("verificado", "true");
      if (disponivel) p.set("disponivel", "true");
      if (ratingMin > 0) p.set("ratingMin", String(ratingMin));
      if (expMin > 0) p.set("expMin", String(expMin));
      p.set("ordenar", ordenar);
      const res = await fetch(`/api/clinica/medicos?${p}`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      setLista(Array.isArray(data.medicos) ? data.medicos : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } finally {
      setLoading(false);
    }
  }, [q, tipo, especialidade, provincia, verificado, disponivel, ratingMin, expMin, ordenar]);

  useEffect(() => {
    const t = setTimeout(load, q ? 400 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const activeFilterCount = [
    tipo !== "",
    especialidade !== "",
    provincia !== "",
    verificado,
    disponivel,
    ratingMin > 0,
    expMin > 0,
    ordenar !== "rating",
  ].filter(Boolean).length;

  function clearFilters() {
    setTipo(""); setEspecialidade(""); setProvincia("");
    setVerificado(false); setDisponivel(false);
    setRatingMin(0); setExpMin(0); setOrdenar("rating");
  }

  return (
    <div className="pb-28">
      <TopBar titulo="Médicos Disponíveis" back="/clinica" />

      <div className="px-4 pt-4 space-y-3">

        {/* Pesquisa + botão filtros */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              type="text"
              placeholder="Nome, especialidade, cidade..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0B3C74]"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-[#0B3C74] text-white border-[#0B3C74]"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            <SlidersHorizontal size={15} strokeWidth={2} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Painel de filtros colapsável */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 shadow-sm">

            {/* Tipo */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tipo de profissional</p>
              <div className="flex gap-2 flex-wrap">
                {TIPO_OPTS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTipo(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      tipo === opt.value ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Especialidade */}
            {especialidades.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Especialidade</p>
                <div className="relative">
                  <select
                    value={especialidade}
                    onChange={(e) => setEspecialidade(e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#0B3C74] bg-white pr-8"
                  >
                    <option value="">Todas as especialidades</option>
                    {especialidades.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Província */}
            {provincias.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Província</p>
                <div className="relative">
                  <select
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#0B3C74] bg-white pr-8"
                  >
                    <option value="">Todas as províncias</option>
                    {provincias.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Rating mínimo + Experiência */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Rating mín.</p>
                <div className="relative">
                  <select
                    value={ratingMin}
                    onChange={(e) => setRatingMin(parseFloat(e.target.value))}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-[#0B3C74] bg-white pr-6"
                  >
                    {RATING_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Experiência</p>
                <div className="relative">
                  <select
                    value={expMin}
                    onChange={(e) => setExpMin(parseInt(e.target.value))}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-[#0B3C74] bg-white pr-6"
                  >
                    {EXP_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Ordenar */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ordenar por</p>
              <div className="relative">
                <select
                  value={ordenar}
                  onChange={(e) => setOrdenar(e.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#0B3C74] bg-white pr-8"
                >
                  {ORDENAR_OPTS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setVerificado((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  verificado ? "bg-[#00A99D] text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                <BadgeCheck size={12} strokeWidth={2} /> Só verificados
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

            {/* Limpar filtros */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs text-red-500 font-semibold"
              >
                <X size={12} strokeWidth={2.5} /> Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Contador */}
        {!loading && (
          <p className="text-xs text-gray-400">
            {total === 0 ? "Nenhum resultado" : `${total} médico${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`}
          </p>
        )}

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
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-[#0B3C74] text-lg shrink-0 overflow-hidden">
                      {m.foto
                        ? <img src={m.foto} alt={m.nome} className="w-full h-full object-cover" />
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
                        {m.anosExperiencia ? <span>{m.anosExperiencia}a exp.</span> : null}
                        <span className="text-gray-300">·</span>
                        <span className="capitalize text-gray-400 text-[10px]">
                          {m.tipo === "MEDICO" ? "Médico" : m.tipo === "ENFERMEIRO" ? "Enfermeiro" : "Técnico"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {lista.length === 0 && (
              <div className="text-center py-14 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
                <p>Nenhum médico encontrado com esses critérios.</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="mt-2 text-xs text-[#0B3C74] font-semibold underline">
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
