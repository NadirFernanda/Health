"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine, X, AlertTriangle } from "lucide-react";

export default function ContratoActions({
  candidaturaId,
  plantaoId,
}: {
  candidaturaId: string;
  plantaoId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"ASSINAR" | "RECUSAR" | null>(null);
  const [aceito, setAceito] = useState(false);
  const [error, setError] = useState("");

  async function handleAction(acao: "ASSINAR" | "RECUSAR") {
    if (acao === "ASSINAR" && !aceito) {
      setError("Deve confirmar que leu e aceita os termos do contrato.");
      return;
    }
    setError("");
    setLoading(acao);
    const res = await fetch(`/api/contrato/${candidaturaId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao }),
    });
    setLoading(null);
    if (res.ok) {
      router.push(`/medico/plantoes/${plantaoId}`);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Erro ao processar. Tente novamente.");
    }
  }

  return (
    <div className="space-y-3">
      {/* Checkbox de confirmação */}
      <label className="flex items-start gap-3 cursor-pointer">
        <div
          onClick={() => setAceito(!aceito)}
          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
            aceito ? "bg-[#0B3C74] border-[#0B3C74]" : "border-gray-300"
          }`}
        >
          {aceito && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="text-xs text-gray-600 leading-relaxed">
          Li e aceito os termos do contrato acima. Compreendo que ao assinar me comprometo a comparecer no plantão na data e hora indicados.
        </span>
      </label>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600">
          <AlertTriangle size={13} strokeWidth={2} />
          {error}
        </div>
      )}

      <button
        onClick={() => handleAction("ASSINAR")}
        disabled={!!loading}
        className="w-full bg-[#0B3C74] text-white font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity active:scale-[0.99]"
      >
        <PenLine size={18} strokeWidth={2} />
        {loading === "ASSINAR" ? "A assinar…" : "ASSINAR CONTRATO"}
      </button>

      <button
        onClick={() => handleAction("RECUSAR")}
        disabled={!!loading}
        className="w-full border border-red-200 text-red-500 font-semibold py-3 rounded-2xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <X size={15} strokeWidth={2} />
        {loading === "RECUSAR" ? "A recusar…" : "Recusar contrato"}
      </button>

      <p className="text-center text-xs text-gray-400">
        Ao assinar, o plantão fica confirmado e o pagamento será processado após conclusão.
      </p>
    </div>
  );
}
