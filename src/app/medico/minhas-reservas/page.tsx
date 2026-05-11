"use client";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/nav";
import Link from "next/link";
import {
  Calendar, MapPin, Clock, Banknote,
  Building2, CheckCircle2, XCircle, Hourglass,
  BadgeCheck, ClipboardList, Loader2, Star,
  LogOut, Search, AlertTriangle, ShieldAlert,
} from "lucide-react";

type EstadoReserva =
  | "CONFIRMADA"
  | "PENDENTE_PAGAMENTO"
  | "CANCELADA"
  | "CANCELADA_PROFISSIONAL"
  | "CANCELADA_CLINICA"
  | "CONCLUIDA"
  | "AGUARDANDO_VISTORIA"
  | "DISPUTA_SALA";

type ReservaAPI = {
  id: string;
  estado: EstadoReserva;
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

type Filtro = "TODAS" | "CONFIRMADA" | "AGUARDANDO_VISTORIA" | "CONCLUIDA" | "CANCELADA" | "DISPUTA_SALA";

const TIPO_LABEL: Record<string, string> = {
  CONSULTORIO: "Consultório",
  OBSERVACAO: "Observação",
  PROCEDIMENTOS: "Procedimentos",
};

const ESTADO_CFG: Record<EstadoReserva, { label: string; icon: React.ReactNode; cls: string }> = {
  CONFIRMADA:           { label: "Confirmada",        icon: <CheckCircle2 size={13} strokeWidth={2} />, cls: "bg-emerald-50 text-emerald-700" },
  PENDENTE_PAGAMENTO:   { label: "Pend. Pagamento",   icon: <Hourglass size={13} strokeWidth={2} />,    cls: "bg-amber-50 text-amber-700" },
  CANCELADA:            { label: "Cancelada",          icon: <XCircle size={13} strokeWidth={2} />,      cls: "bg-red-50 text-red-600" },
  CANCELADA_PROFISSIONAL:{ label: "Cancelada",         icon: <XCircle size={13} strokeWidth={2} />,      cls: "bg-red-50 text-red-600" },
  CANCELADA_CLINICA:    { label: "Cancelada",          icon: <XCircle size={13} strokeWidth={2} />,      cls: "bg-red-50 text-red-600" },
  CONCLUIDA:            { label: "Concluída",          icon: <BadgeCheck size={13} strokeWidth={2} />,   cls: "bg-gray-100 text-gray-500" },
  AGUARDANDO_VISTORIA:  { label: "Em vistoria",        icon: <Search size={13} strokeWidth={2} />,       cls: "bg-blue-50 text-blue-700" },
  DISPUTA_SALA:         { label: "Em disputa",         icon: <ShieldAlert size={13} strokeWidth={2} />,  cls: "bg-orange-50 text-orange-700" },
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

function ReservaCard({
  r,
  onCancelar,
  onTerminar,
  terminandoId,
}: {
  r: ReservaAPI;
  onCancelar: (id: string) => void;
  onTerminar: (id: string) => void;
  terminandoId: string | null;
}) {
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
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-gray-800">{r.sala.nome}</p>
          <span className="text-[10px] font-semibold bg-[#0B3C74]/10 text-[#0B3C74] px-2 py-0.5 rounded-full">
            {TIPO_LABEL[r.sala.tipo] ?? r.sala.tipo}
          </span>
        </div>

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

        <div className="flex items-center gap-1.5">
          <Banknote size={14} strokeWidth={1.75} className="text-[#00A99D]" />
          <span className="text-base font-bold text-[#00A99D]">{formatAOA(r.valorTotal)}</span>
        </div>

        {/* QR code for confirmed reservations */}
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

        {/* Aguardando vistoria notice */}
        {r.estado === "AGUARDANDO_VISTORIA" && (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
            <Search size={13} strokeWidth={2} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-bold">Sessão terminada</p>
              <p className="mt-0.5 text-blue-500">O consultório está a verificar o estado da sala. O pagamento será libertado após a confirmação.</p>
            </div>
          </div>
        )}

        {/* Disputa notice */}
        {r.estado === "DISPUTA_SALA" && (
          <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">
            <AlertTriangle size={13} strokeWidth={2} className="text-orange-600 shrink-0 mt-0.5" />
            <div className="text-xs text-orange-700">
              <p className="font-bold">Disputa aberta</p>
              <p className="mt-0.5 text-orange-500">O consultório reportou um problema durante a vistoria. A equipa MedFreela irá contactá-lo.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 pb-4 pt-1 flex gap-2">
        {/* Active reservation: can cancel or terminate */}
        {r.estado === "CONFIRMADA" && (
          <>
            <button
              onClick={() => onCancelar(r.id)}
              className="flex-1 text-center text-xs font-semibold text-red-600 border border-red-100 bg-red-50 py-2.5 rounded-xl active:opacity-80 transition-opacity"
            >
              Cancelar
            </button>
            <button
              onClick={() => onTerminar(r.id)}
              disabled={terminandoId === r.id}
              className="flex-1 text-center text-xs font-semibold text-white bg-gradient-to-r from-[#0B3C74] to-[#00A99D] py-2.5 rounded-xl active:opacity-80 transition-opacity disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {terminandoId === r.id
                ? <><Loader2 size={12} className="animate-spin" /> A terminar…</>
                : <><LogOut size={12} strokeWidth={2} /> Terminar Reserva</>
              }
            </button>
          </>
        )}

        {/* Completed: rate */}
        {r.estado === "CONCLUIDA" && (
          <Link
            href={`/medico/salas/${r.sala.id}/avaliar?reserva=${r.id}`}
            className="flex-1 text-center text-xs font-semibold text-amber-700 border border-amber-100 bg-amber-50 py-2.5 rounded-xl active:opacity-80 transition-opacity inline-flex items-center justify-center gap-1"
          >
            <Star size={12} strokeWidth={1.75} fill="currentColor" /> Avaliar Sala
          </Link>
        )}
      </div>
    </div>
  );
}

export default function MinhasReservas() {
  const [filtro, setFiltro] = useState<Filtro>("TODAS");
  const [reservas, setReservas] = useState<ReservaAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [terminando, setTerminando] = useState<string | null>(null);

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
      setReservas((prev) => prev.map((r) =>
        r.id === id ? { ...r, estado: "CANCELADA" as EstadoReserva } : r
      ));
    }
    setCancelando(null);
  };

  const terminar = async (id: string) => {
    setTerminando(id);
    const res = await fetch(`/api/medico/reservas/${id}/terminar`, { method: "POST" });
    if (res.ok) {
      setReservas((prev) => prev.map((r) =>
        r.id === id ? { ...r, estado: "AGUARDANDO_VISTORIA" as EstadoReserva } : r
      ));
    }
    setTerminando(null);
  };

  const FILTROS: { key: Filtro; label: string }[] = [
    { key: "TODAS",              label: "Todas" },
    { key: "CONFIRMADA",         label: "Activas" },
    { key: "AGUARDANDO_VISTORIA",label: "Em vistoria" },
    { key: "DISPUTA_SALA",       label: "Disputa" },
    { key: "CONCLUIDA",          label: "Concluídas" },
    { key: "CANCELADA",          label: "Canceladas" },
  ];

  const isCancelada = (e: EstadoReserva) =>
    e === "CANCELADA" || e === "CANCELADA_PROFISSIONAL" || e === "CANCELADA_CLINICA";

  const filtradas = filtro === "TODAS"
    ? reservas
    : filtro === "CANCELADA"
      ? reservas.filter((r) => isCancelada(r.estado))
      : reservas.filter((r) => r.estado === filtro);

  const confirmadas = reservas.filter((r) => r.estado === "CONFIRMADA").length;
  const emVistoria  = reservas.filter((r) => r.estado === "AGUARDANDO_VISTORIA").length;
  const disputas    = reservas.filter((r) => r.estado === "DISPUTA_SALA").length;

  return (
    <div className="pb-28">
      <TopBar titulo="Minhas Reservas" back="/medico" />

      {/* Summary header */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] mx-4 mt-4 rounded-2xl px-5 py-5">
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Reservas activas</p>
        <p className="text-white text-4xl font-black mt-1">{confirmadas}</p>
        <p className="text-blue-200 text-xs mt-1">
          {reservas.length} reserva{reservas.length !== 1 ? "s" : ""} no total
          {emVistoria > 0 && ` · ${emVistoria} em vistoria`}
          {disputas > 0 && ` · ${disputas} em disputa`}
        </p>
        {(emVistoria > 0 || disputas > 0) && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {emVistoria > 0 && (
              <span className="inline-flex items-center gap-1 bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-xl">
                <Search size={11} strokeWidth={2} /> {emVistoria} aguarda vistoria
              </span>
            )}
            {disputas > 0 && (
              <span className="inline-flex items-center gap-1 bg-orange-400/30 text-orange-100 text-xs font-semibold px-2.5 py-1 rounded-xl">
                <AlertTriangle size={11} strokeWidth={2} /> {disputas} em disputa
              </span>
            )}
          </div>
        )}
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
          {FILTROS.map(({ key, label }) => {
            const count = key === "TODAS" ? null
              : key === "CANCELADA" ? reservas.filter((r) => isCancelada(r.estado)).length
              : reservas.filter((r) => r.estado === key).length;
            const hasAlert = (key === "AGUARDANDO_VISTORIA" && emVistoria > 0) || (key === "DISPUTA_SALA" && disputas > 0);
            return (
              <button
                key={key}
                onClick={() => setFiltro(key)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors relative ${
                  filtro === key ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {label}
                {count !== null && count > 0 && (
                  <span className={`ml-1.5 ${filtro === key ? "text-blue-200" : "text-gray-400"}`}>
                    ({count})
                  </span>
                )}
                {hasAlert && filtro !== key && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full" />
                )}
              </button>
            );
          })}
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
              {filtro === "TODAS"
                ? "Ainda não fizeste nenhuma reserva."
                : `Nenhuma reserva com este estado.`}
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
            <div
              key={r.id}
              className={
                cancelando === r.id || terminando === r.id
                  ? "opacity-50 pointer-events-none"
                  : ""
              }
            >
              <ReservaCard
                r={r}
                onCancelar={cancelar}
                onTerminar={terminar}
                terminandoId={terminando}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
