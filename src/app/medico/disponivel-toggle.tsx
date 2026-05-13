"use client";

import { useState } from "react";

export default function DisponibilidadeToggle({ inicial }: { inicial: boolean }) {
  const [disponivel, setDisponivel] = useState(inicial);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    const next = !disponivel;
    setDisponivel(next);
    setLoading(true);
    try {
      await fetch("/api/medico/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disponivelAgora: next }),
      });
    } catch {
      setDisponivel(!next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`mt-3 flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${disponivel ? "bg-green-500/30" : "bg-white/10"}`}>
      <div>
        <p className="text-white text-xs font-bold">Disponível Agora</p>
        <p className="text-blue-200 text-xs">
          {disponivel ? "Clínicas podem contactar-o directamente" : "Activa para receber turnos urgentes"}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`w-12 h-6 rounded-full relative transition-colors shrink-0 disabled:opacity-70 ${disponivel ? "bg-green-400" : "bg-white/30"}`}
        aria-label={disponivel ? "Desactivar disponibilidade" : "Activar disponibilidade"}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${disponivel ? "left-6" : "left-0.5"}`} />
      </button>
    </div>
  );
}
