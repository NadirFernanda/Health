"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function TerminarPlantaoButton({ plantaoId }: { plantaoId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState("");

  async function terminar() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/medico/plantoes/${plantaoId}/terminar`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Erro ao terminar plantão.");
    }
  }

  if (!confirmar) {
    return (
      <button
        onClick={() => setConfirmar(true)}
        className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
      >
        <CheckCircle2 size={18} strokeWidth={2} />
        TERMINAR PLANTÃO
      </button>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-start gap-2 text-sm text-green-800">
        <AlertTriangle size={16} strokeWidth={2} className="shrink-0 mt-0.5 text-green-600" />
        <p>Confirmas que o plantão foi concluído? A clínica será notificada para liberar o teu pagamento.</p>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => setConfirmar(false)}
          disabled={loading}
          className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={terminar}
          disabled={loading}
          className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <CheckCircle2 size={15} strokeWidth={2} />
          {loading ? "A terminar…" : "Confirmar"}
        </button>
      </div>
    </div>
  );
}
