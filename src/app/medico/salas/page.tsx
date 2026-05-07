"use client";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/nav";
import Link from "next/link";
import { Building2, MapPin, Star, ChevronRight, BadgeCheck, Loader2, SlidersHorizontal } from "lucide-react";

type Sala = {
  id: string;
  nome: string;
  tipo: "CONSULTORIO" | "OBSERVACAO" | "PROCEDIMENTOS";
  precoPorHora: number;
  zona: string;
  disponivel: boolean;
  avaliacaoMedia: number;
  totalAvaliacoes: number;
  clinica: { id: string; nome: string; cidade: string; verified: boolean } | null;
  consultorio: { id: string; nome: string; cidade: string; verified: boolean } | null;
  proprietario: { id: string; nome: string; cidade: string; verified: boolean } | null;
  equipamentos: Record<string, boolean>;
};

function formatAOA(v: number) { return new Intl.NumberFormat("pt-AO").format(v) + " AOA"; }

const TIPO_LABEL: Record<string, string> = {
  CONSULTORIO: "Consultório",
  OBSERVACAO: "Observação",
  PROCEDIMENTOS: "Procedimentos",
};

const TIPO_COLOR: Record<string, string> = {
  CONSULTORIO:   "bg-[#0B3C74]/10 text-[#0B3C74]",
  OBSERVACAO:    "bg-teal-50 text-teal-700",
  PROCEDIMENTOS: "bg-purple-50 text-purple-700",
};

const TIPOS = [
  { key: "TODAS",          label: "Todas" },
  { key: "CONSULTORIO",    label: "Consultório" },
  { key: "OBSERVACAO",     label: "Observação" },
  { key: "PROCEDIMENTOS",  label: "Procedimentos" },
];

function SalaCard({ sala }: { sala: Sala }) {
  const equipCount = Object.values(sala.equipamentos).filter(Boolean).length;

  return (
    <Link href={`/medico/salas/${sala.id}`} className="block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#0B3C74]/8 flex items-center justify-center shrink-0">
            <Building2 size={18} strokeWidth={1.75} className="text-[#0B3C74]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-bold text-sm text-gray-900 truncate">{sala.proprietario?.nome ?? "–"}</p>
              {sala.proprietario?.verified && (
                <BadgeCheck size={13} strokeWidth={2} className="text-emerald-500 shrink-0" />
              )}
            </div>
            <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <MapPin size={10} strokeWidth={1.75} className="shrink-0" />
              {sala.zona}
            </p>
          </div>
        </div>
        <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${TIPO_COLOR[sala.tipo] ?? "bg-gray-100 text-gray-500"}`}>
          {TIPO_LABEL[sala.tipo] ?? sala.tipo}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 pb-3 border-t border-gray-50 pt-3 space-y-2">
        <p className="font-semibold text-sm text-gray-800">{sala.nome}</p>
        <div className="flex items-center gap-4">
          <span className="text-[#00A99D] font-bold text-base">
            {formatAOA(sala.precoPorHora)}
            <span className="text-gray-400 font-normal text-xs">/hora</span>
          </span>
          {sala.totalAvaliacoes > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-600">
              <Star size={11} strokeWidth={1.75} className="text-amber-400 fill-amber-400" />
              <span className="font-semibold">{sala.avaliacaoMedia.toFixed(1)}</span>
              <span className="text-gray-400">({sala.totalAvaliacoes})</span>
            </span>
          )}
        </div>
        {equipCount > 0 && (
          <p className="text-xs text-gray-400">{equipCount} equipamento{equipCount !== 1 ? "s" : ""} disponível{equipCount !== 1 ? "eis" : ""}</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <span className="w-full flex items-center justify-center gap-1.5 bg-[#0B3C74] text-white text-xs font-bold py-2.5 rounded-xl tracking-wide">
          Ver disponibilidade <ChevronRight size={13} strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  );
}

export default function BuscarSalas() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [zona, setZona] = useState("Todas");
  const [tipo, setTipo] = useState("TODAS");
  const [apenasEquipadas, setApenasEquipadas] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (zona !== "Todas") params.set("zona", zona);
    if (tipo !== "TODAS") params.set("tipo", tipo);
    setLoading(true);
    fetch(`/api/salas?${params}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setSalas(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [zona, tipo]);

  const filtradas = apenasEquipadas
    ? salas.filter((s) => s.equipamentos.maca && s.equipamentos.computador)
    : salas;

  const zonas = [...new Set(salas.map((s) => s.zona))];

  return (
    <div className="pb-28">
      <TopBar titulo="Salas & Consultórios" back="/medico" />

      {/* Banner */}
      <div className="mx-4 mt-4 bg-gradient-to-br from-[#0B3C74] to-[#00A99D] rounded-2xl px-5 py-5 text-white">
        <p className="font-black text-lg leading-tight">Space-as-a-Service</p>
        <p className="text-blue-200 text-xs mt-1 leading-relaxed">
          Reserve um consultório por hora dentro de uma clínica verificada — sem contratos longos.
        </p>
      </div>

      {/* Filtros */}
      <div className="px-4 pt-4 space-y-3">
        {/* Zona */}
        {zonas.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Zona</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {["Todas", ...zonas].map((z) => (
                <button
                  key={z}
                  onClick={() => setZona(z)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                    zona === z
                      ? "bg-[#0B3C74] text-white border-[#0B3C74]"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tipo */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tipo de Sala</p>
          <div className="flex gap-2 flex-wrap">
            {TIPOS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTipo(t.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  tipo === t.key
                    ? "bg-[#0B3C74] text-white border-[#0B3C74]"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle equipadas */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} strokeWidth={1.75} className="text-gray-500" />
            <span className="text-xs text-gray-700 font-semibold">Com maca + computador</span>
          </div>
          <button
            onClick={() => setApenasEquipadas((v) => !v)}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${apenasEquipadas ? "bg-[#0B3C74]" : "bg-gray-200"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${apenasEquipadas ? "left-5" : "left-0.5"}`} />
          </button>
        </div>
      </div>

      {/* Resultados */}
      <div className="px-4 pt-4 pb-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#0B3C74]" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Building2 size={36} strokeWidth={1.25} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">Nenhuma sala com estes filtros.</p>
            <button
              onClick={() => { setZona("Todas"); setTipo("TODAS"); setApenasEquipadas(false); }}
              className="mt-3 text-xs font-semibold text-[#0B3C74] bg-[#0B3C74]/10 px-4 py-2 rounded-xl"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">{filtradas.length} sala{filtradas.length !== 1 ? "s" : ""} encontrada{filtradas.length !== 1 ? "s" : ""}</p>
            <div className="space-y-3">
              {filtradas.map((s) => <SalaCard key={s.id} sala={s} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
