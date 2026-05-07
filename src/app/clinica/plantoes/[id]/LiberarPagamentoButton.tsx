"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, AlertTriangle } from "lucide-react";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

export default function LiberarPagamentoButton({
  candidaturaId,
  plantaoId,
  nomeMedico,
  valorLiquidoAoa,
  apiPath,
}: {
  candidaturaId: string;
  plantaoId: string;
  nomeMedico: string;
  valorLiquidoAoa: number;
  apiPath?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState("");

  async function liberar() {
    setLoading(true);
    setError("");
    const endpoint = apiPath ?? `/api/clinica/plantoes/${plantaoId}/liberar-pagamento`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidaturaId }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Erro ao liberar pagamento.");
    }
  }

  if (!confirmar) {
    return (
      <button
        onClick={() => setConfirmar(true)}
        className="w-full bg-[#00A99D] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1"
      >
        <Banknote size={13} strokeWidth={2} />
        Liberar Pagamento
      </button>
    );
  }

  return (
    <div className="mt-2 bg-teal-50 border border-teal-200 rounded-2xl p-3 space-y-2">
      <div className="flex items-start gap-2 text-xs text-teal-800">
        <AlertTriangle size={13} strokeWidth={2} className="shrink-0 mt-0.5 text-teal-600" />
        <p>Liberar <strong>{formatAOA(valorLiquidoAoa)}</strong> para {nomeMedico.split(" ")[0]}? A plataforma retém 10% de comissão.</p>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => setConfirmar(false)}
          disabled={loading}
          className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-xl text-xs disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={liberar}
          disabled={loading}
          className="flex-1 bg-[#00A99D] text-white font-bold py-2 rounded-xl text-xs disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <Banknote size={12} strokeWidth={2} />
          {loading ? "A liberar…" : "Confirmar"}
        </button>
      </div>
    </div>
  );
}
