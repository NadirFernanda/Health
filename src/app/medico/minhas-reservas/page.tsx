"use client";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/nav";
import { Calendar, MapPin, ClipboardList, CreditCard, Clock, Banknote, Star, ChevronDown, ChevronUp } from "lucide-react";

type ReservaAPI = {
  id: string;
  estado: "CONFIRMADA" | "PENDENTE" | "CANCELADA" | "CONCLUIDA";
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

type FiltroEstado = "TODAS" | "CONFIRMADA" | "CONCLUIDA" | "CANCELADA";

const estadoMap: Record<ReservaAPI["estado"], { label: string; cls: string }> = {
  CONFIRMADA: { label: "Confirmada", cls: "bg-blue-50 text-[#1A6FBB]" },
  PENDENTE:   { label: "Pendente",   cls: "bg-yellow-50 text-yellow-700" },
  CANCELADA:  { label: "Cancelada",  cls: "bg-red-50 text-red-600" },
  CONCLUIDA:  { label: "Concluída",  cls: "bg-gray-100 text-gray-600" },
};

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

function QRPlaceholder({ codigo }: { codigo: string }) {
  return (
    <div className="flex flex-col items-center bg-gray-50 rounded-xl p-3">
      <div className="w-16 h-16 bg-gray-200 rounded-lg grid grid-cols-4 gap-0.5 p-1 mb-1.5">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className={`rounded-sm ${(i * 7 + 3) % 3 !== 0 ? "bg-gray-800" : "bg-white"}`} />
        ))}
      </div>
      <p className="text-xs font-mono font-bold text-gray-700">{codigo}</p>
    </div>
  );
}

export default function MinhasReservas() {
  const [filtro, setFiltro] = useState<FiltroEstado>("TODAS");
  const [reservas, setReservas] = useState<ReservaAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/medico/reservas")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => { if (Array.isArray(d)) setReservas(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtradas = filtro === "TODAS" ? reservas : reservas.filter((r) => r.estado === filtro);

  const cancelar = async (id: string) => {
    const res = await fetch(`/api/medico/reservas/${id}`, { method: "DELETE" });
    if (res.ok) {
      setReservas((prev) => prev.map((r) => r.id === id ? { ...r, estado: "CANCELADA" as const } : r));
      setExpandido(null);
    }
  };

  return (
    <div>
      <TopBar titulo="Minhas Reservas" back="/medico" />

      {/* Filtros */}
      <div className="px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(["TODAS", "CONFIRMADA", "CONCLUIDA", "CANCELADA"] as FiltroEstado[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filtro === f ? "bg-[#1A6FBB] text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {f === "TODAS" ? "Todas" : estadoMap[f as ReservaAPI["estado"]].label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="px-4 pt-4 space-y-3 pb-8">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">A carregar...</p>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar size={34} strokeWidth={1.5} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhuma reserva encontrada.</p>
            <a href="/medico/salas" className="mt-3 inline-block text-xs text-[#1A6FBB] font-semibold">
              Explorar salas →
            </a>
          </div>
        ) : (
          filtradas.map((r) => {
            const aberto = expandido === r.id;
            const dataFmt = new Date(r.data).toLocaleDateString("pt-AO", { weekday: "short", day: "2-digit", month: "short" });
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  className="w-full text-left px-4 py-4"
                  onClick={() => setExpandido(aberto ? null : r.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{r.sala.clinica.nome} — {r.sala.nome}</p>
                      <p className="text-xs text-gray-500 mt-0.5 inline-flex items-center gap-1"><MapPin size={11} strokeWidth={1.75} /> {r.sala.zona}</p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Calendar size={11} strokeWidth={1.75} /> {dataFmt} às {r.horaInicio} · {r.duracaoHoras}h</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${estadoMap[r.estado].cls}`}>
                        {estadoMap[r.estado].label}
                      </span>
                      <p className="text-[#1A6FBB] font-bold text-sm mt-1">{formatAOA(r.valorTotal)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 inline-flex items-center gap-1">
                    {aberto ? <ChevronUp size={12} strokeWidth={2} /> : <ChevronDown size={12} strokeWidth={2} />}
                    {aberto ? "ocultar" : "ver detalhes"}
                  </p>
                </button>

                {aberto && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                    <div className="flex gap-4 items-start">
                      {r.codigoQr ? (
                        <QRPlaceholder codigo={r.codigoQr} />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs text-center">
                          Sem QR
                        </div>
                      )}
                      <div className="text-xs text-gray-600 space-y-1">
                        {r.codigoQr && (
                          <p className="inline-flex items-center gap-1"><ClipboardList size={12} strokeWidth={1.75} /> Código: <strong className="font-mono">{r.codigoQr}</strong></p>
                        )}
                        <p className="inline-flex items-center gap-1"><CreditCard size={12} strokeWidth={1.75} /> {r.sala.clinica.cidade}</p>
                        <p className="inline-flex items-center gap-1"><Clock size={12} strokeWidth={1.75} /> Duração: {r.duracaoHoras}h</p>
                        <p className="inline-flex items-center gap-1"><Banknote size={12} strokeWidth={1.75} /> Total: {formatAOA(r.valorTotal)}</p>
                      </div>
                    </div>

                    {r.estado === "CONFIRMADA" && (
                      <button
                        onClick={() => cancelar(r.id)}
                        className="w-full border-2 border-red-200 text-red-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        Cancelar Reserva
                      </button>
                    )}
                    {r.estado === "CONCLUIDA" && (
                      <a
                        href={`/medico/salas/${r.sala.id}/avaliar?reserva=${r.id}`}
                        className="block w-full text-center border-2 border-yellow-200 text-yellow-700 font-semibold text-sm py-2.5 rounded-xl hover:bg-yellow-50 transition-colors"
                      >
                        <span className="inline-flex items-center gap-1"><Star size={14} strokeWidth={1.75} fill="currentColor" /> Avaliar Sala</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
