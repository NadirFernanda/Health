"use client";
import { useState } from "react";
import { salasMock, Sala, ZonaLuanda, TipoSala, formatAOA } from "@/lib/mock-data";
import { TopBar } from "@/components/nav";
import Link from "next/link";

const zonas: ZonaLuanda[] = ["Centralidade Horizonte", "Talatona", "Miramar", "Alvalade", "Kilamba"];
const tipos: { key: TipoSala | "TODAS"; label: string }[] = [
  { key: "TODAS", label: "Todas" },
  { key: "CONSULTORIO", label: "Consultório" },
  { key: "OBSERVACAO", label: "Observação" },
  { key: "PROCEDIMENTOS", label: "Procedimentos" },
];

function SalaCard({ sala }: { sala: Sala }) {
  const tipoLabel: Record<TipoSala, string> = {
    CONSULTORIO: "Consultório",
    OBSERVACAO: "Observação",
    PROCEDIMENTOS: "Procedimentos",
  };
  const equipCount = Object.values(sala.equipamentos).filter(Boolean).length;
  return (
    <Link href={`/medico/salas/${sala.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:opacity-90 transition-opacity">
        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl shrink-0">
              🏥
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">{sala.clinica.nome}</p>
              <p className="text-xs text-gray-500">📍 {sala.zona}</p>
            </div>
          </div>
          <span className="bg-purple-50 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
            {tipoLabel[sala.tipo]}
          </span>
        </div>
        <div className="px-4 pb-3 border-t border-gray-50 pt-3 space-y-1.5">
          <p className="font-semibold text-gray-900 text-sm">{sala.nome}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-brand-600 font-bold text-base">{formatAOA(sala.precoPorHora)}<span className="text-gray-400 font-normal text-xs">/hora</span></span>
            <span className="text-yellow-500 text-xs">⭐ {sala.avaliacaoMedia} ({sala.totalAvaliacoes})</span>
          </div>
          <p className="text-xs text-gray-400">{equipCount} equipamentos disponíveis</p>
        </div>
        <div className="px-4 pb-4">
          <span className="w-full block text-center bg-brand-500 text-white text-sm font-semibold py-2.5 rounded-xl">
            Ver disponibilidade →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BuscarSalas() {
  const [zona, setZona] = useState<string>("Todas");
  const [tipo, setTipo] = useState<string>("TODAS");
  const [apenasEquipadas, setApenasEquipadas] = useState(false);

  const filtradas = salasMock.filter((s) => {
    const zonaOk = zona === "Todas" || s.zona === zona;
    const tipoOk = tipo === "TODAS" || s.tipo === tipo;
    const equipOk = !apenasEquipadas || (s.equipamentos.maca && s.equipamentos.computador);
    return zonaOk && tipoOk && equipOk && s.disponivel;
  });

  return (
    <div>
      <TopBar titulo="Salas & Consultórios" />

      {/* Banner */}
      <div className="mx-4 mt-4 bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-4 text-white">
        <p className="font-bold text-sm">Space-as-a-Service</p>
        <p className="text-purple-200 text-xs mt-1">Reserve um consultório por hora dentro de uma clínica verificada</p>
      </div>

      {/* Filtro zona */}
      <div className="px-4 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Zona</p>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {["Todas", ...zonas].map((z) => (
            <button
              key={z}
              onClick={() => setZona(z)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                zona === z ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro tipo */}
      <div className="px-4 pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo de Sala</p>
        <div className="flex gap-2 flex-wrap">
          {tipos.map((t) => (
            <button
              key={t.key}
              onClick={() => setTipo(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                tipo === t.key ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle maca + computador */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <span className="text-xs text-gray-600 font-semibold">Apenas com Maca + Computador</span>
        <button
          onClick={() => setApenasEquipadas((v) => !v)}
          className={`w-11 h-6 rounded-full transition-colors relative ${apenasEquipadas ? "bg-brand-500" : "bg-gray-200"}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${apenasEquipadas ? "left-5" : "left-0.5"}`} />
        </button>
      </div>

      {/* Resultados */}
      <div className="px-4 pt-4 pb-4">
        <p className="text-xs text-gray-500 mb-3">{filtradas.length} sala(s) encontrada(s)</p>
        <div className="space-y-3">
          {filtradas.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm">Nenhuma sala encontrada com estes filtros.</p>
            </div>
          ) : (
            filtradas.map((s) => <SalaCard key={s.id} sala={s} />)
          )}
        </div>
      </div>
    </div>
  );
}
