"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { DisputaForm } from "@/components/disputa-form";

export function DisputaClinicaButton({ candidaturaId }: { candidaturaId: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-center">
        <p className="text-xs font-semibold text-green-700">Disputa aberta</p>
      </div>
    );
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center gap-1.5 border border-red-200 text-red-500 font-semibold text-xs py-2.5 rounded-xl hover:bg-red-50 transition-colors w-full"
        >
          <AlertTriangle size={13} strokeWidth={2} />
          Abrir disputa
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-red-100 p-4 shadow-sm mt-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-800">Abrir disputa</p>
            <button onClick={() => setOpen(false)} className="text-gray-400">
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
