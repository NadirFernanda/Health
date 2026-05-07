"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  MetodoPagamentoSelector,
  TransferenciaBancariaInfo,
  SimulatedPaymentGateway,
  type MetodoPagamento,
} from "@/components/payment-gateway";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

type PagamentoInfo = {
  pagamentoId: string;
  taxaReserva: number;
  especialidade: string;
  metodo: MetodoPagamento;
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
  const [metodo, setMetodo] = useState<MetodoPagamento>("MULTICAIXA_EXPRESS");
  const [pagamentoInfo, setPagamentoInfo] = useState<PagamentoInfo | null>(null);
  const [pagamentoSucesso, setPagamentoSucesso] = useState(false);

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
      body: JSON.stringify({ acao, metodo }),
    });
    setLoading(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Erro ao processar. Tente novamente.");
      return;
    }
    const data = await res.json() as {
      estado: string;
      pagamentoId?: string;
      taxaReserva?: number;
      especialidade?: string;
      metodo?: MetodoPagamento;
    };

    if (acao === "RECUSAR") {
      router.push(`/medico/plantoes/${plantaoId}`);
      router.refresh();
      return;
    }

    setPagamentoInfo({
      pagamentoId: data.pagamentoId!,
      taxaReserva: data.taxaReserva ?? Math.round(valorKwanzas * 0.10),
      especialidade: data.especialidade ?? "",
      metodo: data.metodo ?? metodo,
    });
  }

  if (pagamentoSucesso) {
    return (
      <div className="flex flex-col items-center py-8 gap-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 size={32} strokeWidth={1.5} className="text-green-500" />
        </div>
        <p className="font-bold text-gray-900">Pagamento confirmado!</p>
        <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
          A taxa de reserva está retida em escrow. O teu lugar está garantido.
        </p>
        <button
          onClick={() => { router.push(`/medico/plantoes/${plantaoId}`); router.refresh(); }}
          className="w-full bg-[#0B3C74] text-white font-bold py-4 rounded-2xl"
        >
          Ver o meu plantão
        </button>
      </div>
    );
  }

  if (pagamentoInfo) {
    if (pagamentoInfo.metodo === "TRANSFERENCIA_BANCARIA") {
      return (
        <TransferenciaBancariaInfo
          pagamentoId={pagamentoInfo.pagamentoId}
          valor={pagamentoInfo.taxaReserva}
          onVerPlantoes={() => { router.push(`/medico/plantoes/${plantaoId}`); router.refresh(); }}
        />
      );
    }
    return (
      <SimulatedPaymentGateway
        pagamentoId={pagamentoInfo.pagamentoId}
        metodo={pagamentoInfo.metodo}
        valor={pagamentoInfo.taxaReserva}
        onSucesso={() => setPagamentoSucesso(true)}
        onErro={() => {}}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-xs text-blue-700 space-y-1">
        <p className="font-bold">Taxa de reserva: {formatAOA(Math.round(valorKwanzas * 0.10))}</p>
        <p>Ao assinar, será cobrada uma taxa de 10% do valor do plantão como garantia de presença.</p>
      </div>

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

      <MetodoPagamentoSelector value={metodo} onChange={setMetodo} />

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
