"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CandidaturaActions({
  candidaturaId,
  plantaoId,
  nomeMedico,
}: {
  candidaturaId: string;
  plantaoId: string;
  nomeMedico: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"ACEITE" | "RECUSADO" | null>(null);

  async function handleAction(estado: "ACEITE" | "RECUSADO") {
    setLoading(estado);
    const res = await fetch(`/api/clinica/plantoes/${plantaoId}/candidaturas`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidaturaId, estado }),
    });
    setLoading(null);
    if (res.ok) router.refresh();
  }

  return (
    <>
      <button
        disabled={!!loading}
        onClick={() => handleAction("RECUSADO")}
        className="flex-1 border border-red-200 text-red-500 font-semibold py-2.5 rounded-xl text-xs disabled:opacity-50"
      >
        {loading === "RECUSADO" ? "…" : "Recusar"}
      </button>
      <button
        disabled={!!loading}
        onClick={() => handleAction("ACEITE")}
        className="flex-1 bg-[#00A99D] text-white font-bold py-2.5 rounded-xl text-xs disabled:opacity-50"
      >
        {loading === "ACEITE" ? "…" : "Aceitar"}
      </button>
    </>
  );
}
