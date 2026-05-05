"use client";

import { useState, useEffect, useRef } from "react";
import { Send, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";

interface Mensagem {
  id: string;
  corpo: string;
  criadoEm: string;
  autorId: string;
  autorRole: string;
}

interface DisputaDetalhe {
  id: string;
  tipo: string;
  estado: string;
  descricao: string;
  resolucaoNota?: string;
  ajusteValorKz?: number;
  criadoEm: string;
  resolvidoEm?: string;
  medicoNome: string;
  clinicaNome: string;
  mensagens: Mensagem[];
}

const TIPO_LABELS: Record<string, string> = {
  NAO_COMPARECEU: "Médico não compareceu",
  NAO_PAGOU: "Clínica não pagou",
  QUALIDADE: "Problema de qualidade",
  CANCELAMENTO: "Cancelamento indevido",
  OUTRO: "Outro",
};

const ESTADO_MAP: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  ABERTA:     { label: "Aberta",     cls: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: <Clock size={13} strokeWidth={2} /> },
  EM_ANALISE: { label: "Em análise", cls: "bg-blue-50 text-blue-700 border-blue-200",       icon: <AlertTriangle size={13} strokeWidth={2} /> },
  RESOLVIDA:  { label: "Resolvida",  cls: "bg-green-50 text-green-700 border-green-200",    icon: <CheckCircle2 size={13} strokeWidth={2} /> },
  ENCERRADA:  { label: "Encerrada",  cls: "bg-gray-100 text-gray-500 border-gray-200",      icon: <XCircle size={13} strokeWidth={2} /> },
};

interface DisputaThreadProps {
  disputaId: string;
  currentUserId: string;
}

export function DisputaThread({ disputaId, currentUserId }: DisputaThreadProps) {
  const [disputa, setDisputa] = useState<DisputaDetalhe | null>(null);
  const [corpo, setCorpo] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/disputas/${disputaId}`)
      .then((r) => r.json())
      .then(setDisputa)
      .catch(() => {});
  }, [disputaId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [disputa?.mensagens]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!corpo.trim()) return;
    setSending(true);
    await fetch(`/api/disputas/${disputaId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ corpo }),
    });
    setCorpo("");
    const updated = await fetch(`/api/disputas/${disputaId}`).then((r) => r.json());
    setDisputa(updated);
    setSending(false);
  }

  if (!disputa) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-7 h-7 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const estadoInfo = ESTADO_MAP[disputa.estado] ?? ESTADO_MAP.ABERTA;
  const isEncerrada = disputa.estado === "RESOLVIDA" || disputa.estado === "ENCERRADA";

  return (
    <div className="space-y-4">
      {/* Header da disputa */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-gray-800">{TIPO_LABELS[disputa.tipo] ?? disputa.tipo}</p>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${estadoInfo.cls}`}>
            {estadoInfo.icon} {estadoInfo.label}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {disputa.medicoNome} ↔ {disputa.clinicaNome}
        </p>
        <p className="text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{disputa.descricao}</p>

        {disputa.resolucaoNota && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
            <p className="text-xs font-bold text-green-700 mb-0.5">Decisão do admin</p>
            <p className="text-xs text-green-800">{disputa.resolucaoNota}</p>
            {disputa.ajusteValorKz && (
              <p className="text-xs font-bold text-green-700 mt-1">
                Ajuste aplicado: {disputa.ajusteValorKz > 0 ? "+" : ""}{new Intl.NumberFormat("pt-AO").format(disputa.ajusteValorKz)} AOA
              </p>
            )}
          </div>
        )}
      </div>

      {/* Mensagens */}
      <div className="space-y-2">
        {disputa.mensagens.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-4">Sem mensagens ainda. Adiciona contexto abaixo.</p>
        )}
        {disputa.mensagens.map((m) => {
          const isMine = m.autorId === currentUserId;
          const isAdmin = m.autorRole === "ADMIN";
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-xs ${
                isAdmin
                  ? "bg-[#0B3C74] text-white"
                  : isMine
                  ? "bg-[#00A99D] text-white"
                  : "bg-white border border-gray-100 text-gray-800"
              }`}>
                {isAdmin && <p className="text-[10px] font-bold opacity-70 mb-0.5">Admin</p>}
                <p className="leading-relaxed">{m.corpo}</p>
                <p className={`text-[10px] mt-1 ${isMine || isAdmin ? "opacity-60" : "text-gray-400"}`}>
                  {new Date(m.criadoEm).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isEncerrada && (
        <form onSubmit={enviar} className="flex gap-2">
          <input
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            placeholder="Adiciona contexto ou evidência..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/30"
          />
          <button
            type="submit"
            disabled={sending || !corpo.trim()}
            className="w-10 h-10 rounded-xl bg-[#0B3C74] text-white flex items-center justify-center disabled:opacity-40"
          >
            <Send size={16} strokeWidth={2} />
          </button>
        </form>
      )}
    </div>
  );
}
