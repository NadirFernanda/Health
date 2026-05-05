"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { DisputaForm } from "@/components/disputa-form";

export function DisputaButton({ candidaturaId }: { candidaturaId: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 text-center">
        <p className="text-sm font-semibold text-green-700">Disputa aberta com sucesso</p>
        <p className="text-xs text-green-600 mt-0.5">O admin irá analisar e contactar ambas as partes.</p>
      </div>
    );
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 font-semibold text-sm py-3 rounded-2xl hover:bg-red-50 transition-colors"
        >
          <AlertTriangle size={15} strokeWidth={2} />
          Abrir disputa
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-red-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-800">Abrir disputa</p>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          <DisputaForm
            candidaturaId={candidaturaId}
            onSuccess={() => setDone(true)}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
