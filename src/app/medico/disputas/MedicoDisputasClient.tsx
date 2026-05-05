"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/nav";
import { AlertTriangle, CheckCircle2, XCircle, Clock, ChevronRight } from "lucide-react";

interface DisputaItem {
  id: string;
  tipo: string;
  estado: string;
  plantaoEspecialidade: string;
  plantaoData: string;
  contraparte: string;
  criadoEm: string;
}

const TIPO_LABELS: Record<string, string> = {
  NAO_COMPARECEU: "Não compareceu",
  NAO_PAGOU: "Não pagou",
  QUALIDADE: "Qualidade",
  CANCELAMENTO: "Cancelamento",
  OUTRO: "Outro",
};

const ESTADO_MAP: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  ABERTA:     { label: "Aberta",     cls: "bg-yellow-50 text-yellow-700", icon: <Clock size={12} strokeWidth={2} /> },
  EM_ANALISE: { label: "Em análise", cls: "bg-blue-50 text-blue-700",     icon: <AlertTriangle size={12} strokeWidth={2} /> },
  RESOLVIDA:  { label: "Resolvida",  cls: "bg-green-50 text-green-700",   icon: <CheckCircle2 size={12} strokeWidth={2} /> },
  ENCERRADA:  { label: "Encerrada",  cls: "bg-gray-100 text-gray-500",    icon: <XCircle size={12} strokeWidth={2} /> },
};

export default function MedicoDisputasClient({ userId: _ }: { userId: string }) {
  const [disputas, setDisputas] = useState<DisputaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/disputas")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setDisputas(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <TopBar titulo="As minhas disputas" back="/medico" />
      <div className="flex justify-center pt-16">
        <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div>
      <TopBar titulo="As minhas disputas" back="/medico" />
      <div className="px-4 pt-4 pb-10 space-y-3">
        {disputas.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <AlertTriangle size={36} className="mx-auto mb-3 text-gray-300" strokeWidth={1.25} />
            <p className="text-sm">Nenhuma disputa aberta.</p>
          </div>
        )}
        {disputas.map((d) => {
          const est = ESTADO_MAP[d.estado] ?? ESTADO_MAP.ABERTA;
          return (
            <Link
              key={d.id}
              href={`/medico/disputas/${d.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-4 shadow-sm active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{TIPO_LABELS[d.tipo] ?? d.tipo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{d.contraparte} · {d.plantaoEspecialidade}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(d.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${est.cls}`}>
                    {est.icon} {est.label}
                  </span>
                  <ChevronRight size={14} strokeWidth={2} className="text-gray-300" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
