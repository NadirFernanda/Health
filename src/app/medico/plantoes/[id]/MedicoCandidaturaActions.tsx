"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, X } from "lucide-react";

export default function MedicoCandidaturaActions({
  candidaturaId,
  plantaoId,
  nomeMedico,
}: {
  candidaturaId: string;
  plantaoId: string;
  nomeMedico: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"CONTRATO_PENDENTE" | "RECUSADO" | null>(null);
  const [error, setError] = useState("");

  async function handleAction(estado: "CONTRATO_PENDENTE" | "RECUSADO") {
    setLoading(estado);
    setError("");
    const res = await fetch(`/api/medico/publicar/${plantaoId}/candidaturas`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidaturaId, estado }),
    });
    setLoading(null);
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Erro ao processar.");
    }
  }

  return (
    <div className="flex flex-col gap-1.5 flex-1">
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
      <div className="flex gap-2">
        <button
          disabled={!!loading}
          onClick={() => handleAction("RECUSADO")}
          className="flex-1 border border-red-200 text-red-500 font-semibold py-2.5 rounded-xl text-xs disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <X size={12} strokeWidth={2.5} />
          {loading === "RECUSADO" ? "…" : "Recusar"}
        </button>
        <button
          disabled={!!loading}
          onClick={() => handleAction("CONTRATO_PENDENTE")}
          className="flex-1 bg-[#00A99D] text-white font-bold py-2.5 rounded-xl text-xs disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <FileText size={12} strokeWidth={2.5} />
          {loading === "CONTRATO_PENDENTE" ? "…" : `Aceitar ${nomeMedico.split(" ")[0]}`}
        </button>
      </div>
    </div>
  );
}
