"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/nav";
import {
  Star, BadgeCheck, Search, MapPin, Zap,
  SlidersHorizontal, X, ChevronDown, ChevronLeft, Stethoscope,
} from "lucide-react";

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
  const router = useRouter();
  const [lista, setLista] = useState<Medico[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [provincias, setProvincias] = useState<string[]>([]);

  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [provincia, setProvincia] = useState("");
  const [verificado, setVerificado] = useState(false);
  const [disponivel, setDisponivel] = useState(false);
  const [ratingMin, setRatingMin] = useState(0);
  const [expMin, setExpMin] = useState(0);
  const [ordenar, setOrdenar] = useState("rating");

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
    <div className="pb-28 bg-gray-50 min-h-screen">

      {/* Header com gradiente */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] px-5 pt-6 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-xl">Médicos</h1>
            <p className="text-blue-200 text-xs mt-0.5">
              {loading ? "A carregar..." : `${total} profissional${total !== 1 ? "is" : ""} encontrado${total !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Stethoscope size={20} strokeWidth={1.75} className="text-white" />
          </div>
        </div>

        {/* Pesquisa */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={2} />
          <input
            type="text"
            placeholder="Nome, especialidade, cidade..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl text-sm outline-none shadow-sm placeholder:text-gray-400"
          />
        </div>

        {/* Filtros rápidos */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setVerificado((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              verificado ? "bg-white text-[#0B3C74]" : "bg-white/20 text-white"
            }`}
          >
            <BadgeCheck size={12} strokeWidth={2} /> Verificados
          </button>
          <button
            onClick={() => setDisponivel((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              disponivel ? "bg-white text-green-600" : "bg-white/20 text-white"
            }`}
          >
            <Zap size={12} strokeWidth={2} /> Disponível agora
          </button>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`relative ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              showFilters || activeFilterCount > 0 ? "bg-white text-[#0B3C74]" : "bg-white/20 text-white"
            }`}
          >
            <SlidersHorizontal size={12} strokeWidth={2} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* Painel de filtros avançados */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 shadow-sm">

            {/* Tipo */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tipo de profissional</p>
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
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Especialidade</p>
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
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Província</p>
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

            {/* Rating + Experiência */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Rating mín.</p>
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
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Experiência</p>
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
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ordenar por</p>
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

            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
                <X size={12} strokeWidth={2.5} /> Limpar todos os filtros
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center pt-12">
            <div className="w-7 h-7 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Lista */}
        {!loading && (
          <div className="space-y-3">
            {lista.map((m) => {
              const iniciais = m.nome.trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
              const tipoLabel = m.tipo === "MEDICO" ? "Médico" : m.tipo === "ENFERMEIRO" ? "Enfermeiro" : "Técnico";
              return (
                <Link
                  key={m.id}
                  href={`/clinica/medicos/${m.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-4 active:bg-gray-50 transition-colors shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center font-bold text-[#0B3C74] text-lg shrink-0 overflow-hidden">
                      {m.foto
                        ? <img src={m.foto} alt={m.nome} className="w-full h-full object-cover" />
                        : iniciais}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Nome + badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate">{m.nome}</p>
                          {m.verified && <BadgeCheck size={14} strokeWidth={2} className="text-[#00A99D] shrink-0" />}
                        </div>
                        {m.disponivelAgora && (
                          <span className="text-[9px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full shrink-0 whitespace-nowrap">
                            Disponível
                          </span>
                        )}
                      </div>

                      {/* Especialidade + tipo */}
                      <p className="text-xs text-gray-500 mt-0.5">
                        {m.especialidade}{m.subEspecialidade ? ` · ${m.subEspecialidade}` : ""}
                        <span className="text-gray-300 mx-1">·</span>
                        <span className="text-gray-400">{tipoLabel}</span>
                      </p>

                      {/* Localização */}
                      {(m.cidade || m.provincia) && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <MapPin size={10} strokeWidth={1.75} className="shrink-0" />
                          {m.cidade ? `${m.cidade}, ` : ""}{m.provincia}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50">
                        <span className="flex items-center gap-1 text-yellow-500 text-xs font-semibold">
                          <Star size={11} strokeWidth={1.75} fill="currentColor" />
                          {m.rating.toFixed(1)}
                          <span className="text-gray-300 font-normal">({m.totalAvaliacoes})</span>
                        </span>
                        <span className="text-gray-300 text-xs">·</span>
                        <span className="text-gray-500 text-xs">{m.totalPlantoes} plantões</span>
                        {m.anosExperiencia ? (
                          <>
                            <span className="text-gray-300 text-xs">·</span>
                            <span className="text-gray-500 text-xs">{m.anosExperiencia}a exp.</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {lista.length === 0 && (
              <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
                <Stethoscope size={36} className="mx-auto mb-3 text-gray-200" strokeWidth={1.25} />
                <p className="text-sm font-medium">Nenhum médico encontrado</p>
                <p className="text-xs text-gray-300 mt-1">Tenta ajustar os filtros de pesquisa</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="mt-3 text-xs text-[#0B3C74] font-semibold underline">
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav role="clinica" />
    </div>
  );
}
