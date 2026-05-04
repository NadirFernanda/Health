"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Send } from "lucide-react";

type Mensagem = {
  id: string;
  corpo: string;
  isMe: boolean;
  criadoEm: string;
};

type Props = {
  candidaturaId: string;
  outroNome: string;
  mensagemInicial?: string | null;
  estadoInicial: string;
  meuUserId?: string;
};

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function formatDia(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  if (d.toDateString() === hoje.toDateString()) return "Hoje";
  if (d.toDateString() === ontem.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

const ESTADO_LABEL: Record<string, { label: string; cls: string }> = {
  PENDENTE:  { label: "Candidatura pendente",  cls: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  ACEITE:    { label: "Candidatura aceite",    cls: "bg-green-50 text-green-700 border-green-100" },
  RECUSADO:  { label: "Candidatura recusada",  cls: "bg-red-50 text-red-600 border-red-100" },
  CANCELADA: { label: "Candidatura cancelada", cls: "bg-gray-50 text-gray-500 border-gray-100" },
};

export default function ChatWindow({ candidaturaId, outroNome, mensagemInicial, estadoInicial }: Props) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState(estadoInicial);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const carregar = useCallback(async () => {
    const res = await fetch(`/api/mensagens/${candidaturaId}`);
    if (!res.ok) return;
    const d = await res.json();
    setMensagens(d.mensagens ?? []);
    setEstado(d.estado ?? estadoInicial);
  }, [candidaturaId, estadoInicial]);

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 5000);
    return () => clearInterval(interval);
  }, [carregar]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function enviar() {
    const corpo = texto.trim();
    if (!corpo || enviando) return;
    setEnviando(true);
    setTexto("");
    const res = await fetch(`/api/mensagens/${candidaturaId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ corpo }),
    });
    if (res.ok) {
      const nova = await res.json();
      setMensagens((prev) => [...prev, nova]);
    }
    setEnviando(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  const estadoInfo = ESTADO_LABEL[estado];

  // Agrupar mensagens por dia para mostrar separadores
  type Group = { dia: string; items: Mensagem[] };
  const grupos: Group[] = [];
  for (const m of mensagens) {
    const dia = formatDia(m.criadoEm);
    const last = grupos[grupos.length - 1];
    if (!last || last.dia !== dia) grupos.push({ dia, items: [m] });
    else last.items.push(m);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Barra de estado da candidatura */}
      {estadoInfo && (
        <div className={`mx-4 mt-3 px-3 py-2 rounded-xl border text-xs font-semibold text-center ${estadoInfo.cls}`}>
          {estadoInfo.label}
        </div>
      )}

      {/* Mensagem inicial (quando aplicou) */}
      {mensagemInicial && mensagens.length === 0 && (
        <div className="mx-4 mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
          <p className="text-xs text-gray-400 mb-1">Mensagem na candidatura</p>
          <p className="text-sm text-gray-700 italic">&ldquo;{mensagemInicial}&rdquo;</p>
        </div>
      )}

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 pb-4">
        {grupos.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <p className="text-gray-400 text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-gray-300 text-xs mt-1">Envia a primeira mensagem a {outroNome}.</p>
          </div>
        )}

        {grupos.map((g) => (
          <div key={g.dia}>
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">{g.dia}</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            {g.items.map((m) => (
              <div key={m.id} className={`flex mb-1.5 ${m.isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-5 ${
                    m.isMe
                      ? "bg-[#0B3C74] text-white rounded-br-md"
                      : "bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.corpo}</p>
                  <p className={`text-[10px] mt-1 text-right ${m.isMe ? "text-blue-200" : "text-gray-400"}`}>
                    {formatHora(m.criadoEm)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input fixo no fundo */}
      <div className="border-t border-gray-100 bg-white px-4 py-3 safe-area-bottom">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Mensagem para ${outroNome}…`}
            rows={1}
            maxLength={1000}
            className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#0B3C74] transition-colors max-h-32 overflow-y-auto"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            onClick={enviar}
            disabled={!texto.trim() || enviando}
            className="w-10 h-10 bg-[#0B3C74] text-white rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
          >
            <Send size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
