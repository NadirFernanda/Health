"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

const TIPO_LABELS: Record<string, string> = {
  NAO_COMPARECEU: "Médico não compareceu",
  NAO_PAGOU: "Clínica não pagou",
  QUALIDADE: "Problema de qualidade",
  CANCELAMENTO: "Cancelamento indevido",
  OUTRO: "Outro",
};

interface DisputaFormProps {
  candidaturaId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DisputaForm({ candidaturaId, onSuccess, onCancel }: DisputaFormProps) {
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/disputas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidaturaId, tipo, descricao }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao abrir disputa");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3">
        <AlertTriangle size={18} strokeWidth={1.75} className="text-[#00A99D] shrink-0 mt-0.5" />
        <p className="text-xs text-[#0B3C74]">
          Abre uma disputa apenas se tentaste resolver o problema directamente. O admin irá analisar e pode aplicar ajustes financeiros.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">{error}</div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Motivo</label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/30 bg-white"
        >
          <option value="">Selecciona o motivo</option>
          {Object.entries(TIPO_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
          Descrição detalhada <span className="text-gray-400 font-normal">(mín. 20 caracteres)</span>
        </label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          placeholder="Descreve o que aconteceu com o máximo de detalhe possível..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/30 resize-none"
        />
        <p className="text-right text-xs text-gray-400 mt-1">{descricao.length}/2000</p>
      </div>

      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-3 rounded-xl"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold py-3 rounded-xl transition-colors"
        >
          {loading ? "A enviar..." : "Abrir Disputa"}
        </button>
      </div>
    </form>
  );
}
