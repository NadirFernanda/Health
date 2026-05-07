"use client";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/nav";
import Link from "next/link";
import {
  Calendar, MapPin, Clock, Banknote, Star,
  Building2, CheckCircle2, XCircle, Hourglass,
  BadgeCheck, ClipboardList, Loader2,
} from "lucide-react";

type ReservaAPI = {
  id: string;
  estado: "CONFIRMADA" | "PENDENTE_PAGAMENTO" | "CANCELADA" | "CONCLUIDA";
  codigoQr: string | null;
  data: string;
  horaInicio: string;
  duracaoHoras: number;
  valorTotal: number;
  criadoEm: string;
  sala: {
    id: string;
    nome: string;
    tipo: string;
    zona: string;
    clinica: { id: string; nome: string; cidade: string };
  };
};

type Filtro = "TODAS" | "CONFIRMADA" | "CONCLUIDA" | "CANCELADA";

const TIPO_LABEL: Record<string, string> = {
  CONSULTORIO: "Consultório",
  OBSERVACAO: "Observação",
  PROCEDIMENTOS: "Procedimentos",
};

const ESTADO_CFG: Record<ReservaAPI["estado"], { label: string; icon: React.ReactNode; cls: string; dot: string }> = {
  CONFIRMADA:        { label: "Confirmada",        icon: <CheckCircle2 size={13} strokeWidth={2} />, cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" },
  PENDENTE_PAGAMENTO:{ label: "Pend. Pagamento",   icon: <Hourglass size={13} strokeWidth={2} />,    cls: "bg-amber-50 text-amber-700",   dot: "bg-amber-400" },
  CANCELADA:         { label: "Cancelada",          icon: <XCircle size={13} strokeWidth={2} />,      cls: "bg-red-50 text-red-600",       dot: "bg-red-400" },
  CONCLUIDA:         { label: "Concluída",          icon: <BadgeCheck size={13} strokeWidth={2} />,   cls: "bg-gray-100 text-gray-500",    dot: "bg-gray-400" },
};

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-AO", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });
}

function QRCode({ codigo }: { codigo: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 bg-gray-50 rounded-xl p-3 w-fit">
      <div className="w-14 h-14 bg-white border border-gray-200 rounded-lg grid grid-cols-4 gap-px p-1">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className={`rounded-[2px] ${(i * 7 + 3) % 3 !== 0 ? "bg-gray-900" : "bg-white"}`} />
        ))}
      </div>
      <p className="text-[10px] font-mono font-bold text-gray-600 tracking-wide">{codigo}</p>
    </div>
  );
}

function ReservaCard({ r, onCancelar }: { r: ReservaAPI; onCancelar: (id: string) => void }) {
  const cfg = ESTADO_CFG[r.estado] ?? ESTADO_CFG.CANCELADA;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#0B3C74]/8 flex items-center justify-center shrink-0">
            <Building2 size={18} strokeWidth={1.75} className="text-[#0B3C74]" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-gray-900 truncate">{r.sala.clinica.nome}</p>
            <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <MapPin size={10} strokeWidth={1.75} className="shrink-0" />
              {r.sala.zona}
            </p>
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
          {cfg.icon}{cfg.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 pb-3 border-t border-gray-50 pt-3 space-y-2.5">
        {/* Sala name + type */}
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-gray-800">{r.sala.nome}</p>
          <span className="text-[10px] font-semibold bg-[#0B3C74]/10 text-[#0B3C74] px-2 py-0.5 rounded-full">
            {TIPO_LABEL[r.sala.tipo] ?? r.sala.tipo}
          </span>
        </div>

        {/* Date + duration */}
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} strokeWidth={1.75} className="text-gray-400" />
            {formatData(r.data)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} strokeWidth={1.75} className="text-gray-400" />
            {r.horaInicio} · {r.duracaoHoras}h
          </span>
        </div>

        {/* Value */}
        <div className="flex items-center gap-1.5">
          <Banknote size={14} strokeWidth={1.75} className="text-[#00A99D]" />
          <span className="text-base font-bold text-[#00A99D]">{formatAOA(r.valorTotal)}</span>
        </div>

        {/* QR code for confirmed */}
        {r.estado === "CONFIRMADA" && r.codigoQr && (
          <div className="flex items-center gap-3 mt-1">
            <QRCode codigo={r.codigoQr} />
            <div className="text-xs text-gray-500 space-y-1">
              <p className="flex items-center gap-1">
                <ClipboardList size={11} strokeWidth={1.75} />
                Código de acesso
              </p>
              <p className="font-mono font-bold text-gray-800 text-sm">{r.codigoQr}</p>
              <p className="text-gray-400">Apresente na recepção</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      {(r.estado === "CONFIRMADA" || r.estado === "CONCLUIDA") && (
        <div className="px-4 pb-4 pt-1 flex gap-2">
          {r.estado === "CONFIRMADA" && (
            <button
              onClick={() => onCancelar(r.id)}
              className="flex-1 text-center text-xs font-semibold text-red-600 border border-red-100 bg-red-50 py-2.5 rounded-xl active:opacity-80 transition-opacity"
            >
              Cancelar Reserva
            </button>
          )}
          {r.estado === "CONCLUIDA" && (
            <Link
              href={`/medico/salas/${r.sala.id}/avaliar?reserva=${r.id}`}
              className="flex-1 text-center text-xs font-semibold text-amber-700 border border-amber-100 bg-amber-50 py-2.5 rounded-xl active:opacity-80 transition-opacity inline-flex items-center justify-center gap-1"
            >
              <Star size={12} strokeWidth={1.75} fill="currentColor" /> Avaliar Sala
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function MinhasReservas() {
  const [filtro, setFiltro] = useState<Filtro>("TODAS");
  const [reservas, setReservas] = useState<ReservaAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/medico/reservas")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => { if (Array.isArray(d)) setReservas(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cancelar = async (id: string) => {
    setCancelando(id);
    const res = await fetch(`/api/medico/reservas/${id}`, { method: "DELETE" });
    if (res.ok) {
      setReservas((prev) => prev.map((r) => r.id === id ? { ...r, estado: "CANCELADA" as const } : r));
    }
    setCancelando(null);
  };

  const FILTROS: { key: Filtro; label: string }[] = [
    { key: "TODAS", label: "Todas" },
    { key: "CONFIRMADA", label: "Confirmadas" },
    { key: "CONCLUIDA", label: "Concluídas" },
    { key: "CANCELADA", label: "Canceladas" },
  ];

  const filtradas = filtro === "TODAS" ? reservas : reservas.filter((r) => r.estado === filtro);
  const confirmadas = reservas.filter((r) => r.estado === "CONFIRMADA").length;

  return (
    <div className="pb-28">
      <TopBar titulo="Minhas Reservas" back="/medico" />

      {/* Summary header */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] mx-4 mt-4 rounded-2xl px-5 py-5">
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Reservas activas</p>
        <p className="text-white text-4xl font-black mt-1">{confirmadas}</p>
        <p className="text-blue-200 text-xs mt-1">
          {reservas.length} reserva{reservas.length !== 1 ? "s" : ""} no total
        </p>
        <Link
          href="/medico/salas"
          className="mt-4 bg-white text-[#0B3C74] font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5"
        >
          <Building2 size={13} strokeWidth={2} />
          Reservar nova sala
        </Link>
      </div>

      {/* Filtros */}
      <div className="px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTROS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filtro === key ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {label}
              {key !== "TODAS" && (
                <span className={`ml-1.5 ${filtro === key ? "text-blue-200" : "text-gray-400"}`}>
                  ({reservas.filter((r) => r.estado === key).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#0B3C74]" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Building2 size={36} strokeWidth={1.25} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              {filtro === "TODAS" ? "Ainda não fizeste nenhuma reserva." : `Nenhuma reserva ${FILTROS.find(f => f.key === filtro)?.label.toLowerCase()}.`}
            </p>
            {filtro === "TODAS" && (
              <Link
                href="/medico/salas"
                className="mt-4 inline-block text-xs font-semibold text-[#0B3C74] bg-[#0B3C74]/10 px-4 py-2 rounded-xl"
              >
                Explorar salas disponíveis →
              </Link>
            )}
          </div>
        ) : (
          filtradas.map((r) => (
            <div key={r.id} className={cancelando === r.id ? "opacity-50 pointer-events-none" : ""}>
              <ReservaCard r={r} onCancelar={cancelar} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
