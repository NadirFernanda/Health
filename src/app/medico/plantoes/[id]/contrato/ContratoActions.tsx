"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine, X, AlertTriangle, Landmark, Clock, CheckCircle2 } from "lucide-react";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

type PagamentoInfo = {
  pagamentoId: string;
  taxaReserva: number;
  especialidade: string;
};

export default function ContratoActions({
  candidaturaId,
  plantaoId,
  valorKwanzas,
}: {
  candidaturaId: string;
  plantaoId: string;
  valorKwanzas: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"ASSINAR" | "RECUSAR" | null>(null);
  const [aceito, setAceito] = useState(false);
  const [error, setError] = useState("");
  const [pagamentoInfo, setPagamentoInfo] = useState<PagamentoInfo | null>(null);

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
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Erro ao processar. Tente novamente.");
      return;
    }
    const data = await res.json() as { estado: string; pagamentoId?: string; taxaReserva?: number; especialidade?: string };

    if (acao === "RECUSAR") {
      router.push(`/medico/plantoes/${plantaoId}`);
      router.refresh();
      return;
    }

    // ASSINAR — mostrar instruções de pagamento
    setPagamentoInfo({
      pagamentoId: data.pagamentoId!,
      taxaReserva: data.taxaReserva ?? Math.round(valorKwanzas * 0.10),
      especialidade: data.especialidade ?? "",
    });
  }

  if (pagamentoInfo) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 leading-5">
          <p className="font-bold mb-1 flex items-center gap-1.5">
            <CheckCircle2 size={15} strokeWidth={2} className="text-amber-600" />
            Contrato assinado — aguarda confirmação do pagamento
          </p>
          <p>Efectua a transferência bancária e o teu lugar fica reservado assim que o pagamento for confirmado.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Taxa de reserva</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Taxa de serviço (10%)</span>
            <span className="font-bold text-[#0B3C74]">{formatAOA(pagamentoInfo.taxaReserva)}</span>
          </div>
          <p className="text-xs text-gray-400">Este valor é retido pela plataforma para garantir a tua reserva.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Dados para transferência</p>
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <Landmark size={14} strokeWidth={1.75} className="text-gray-400 shrink-0" />
            <span>NIB: <strong>0040 0000 12345 67890 10 1</strong></span>
          </p>
          <p className="text-xs text-gray-500">Banco: BAI · Titular: Medfreela Lda</p>
          <p className="text-xs text-gray-500">
            Referência: <strong className="font-mono">{pagamentoInfo.pagamentoId.slice(-10).toUpperCase()}</strong>
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-start gap-2 text-xs text-blue-700">
          <Clock size={13} strokeWidth={2} className="shrink-0 mt-0.5" />
          O teu lugar é confirmado após validação do pagamento pelo administrador. Receberás uma notificação.
        </div>

        <button
          onClick={() => { router.push(`/medico/plantoes/${plantaoId}`); router.refresh(); }}
          className="w-full bg-[#0B3C74] text-white font-bold py-4 rounded-2xl"
        >
          Ver o meu plantão
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Resumo da taxa de reserva */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-xs text-blue-700 space-y-1">
        <p className="font-bold">Taxa de reserva: {formatAOA(Math.round(valorKwanzas * 0.10))}</p>
        <p>Ao assinar, será cobrada uma taxa de 10% do valor do plantão como garantia de presença.</p>
      </div>

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
          Li e aceito os termos do contrato acima. Compreendo que ao assinar me comprometo a comparecer no plantão na data e hora indicados e a pagar a taxa de reserva.
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
        {loading === "ASSINAR" ? "A assinar…" : "ASSINAR E PAGAR"}
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
        Ao assinar, será cobrada uma taxa de reserva de {formatAOA(Math.round(valorKwanzas * 0.10))}. O teu salário de {formatAOA(Math.round(valorKwanzas * 0.85))} será pago após a conclusão do plantão.
      </p>
    </div>
  );
}
