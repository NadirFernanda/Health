"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Printer, ArrowLeft } from "lucide-react";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-AO", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const METODO_LABEL: Record<string, string> = {
  MULTICAIXA_EXPRESS: "Multicaixa Express",
  TPA: "Cartão / TPA",
  TRANSFERENCIA_BANCARIA: "Transferência Bancária",
};

const SUBTIPO_LABEL: Record<string, string> = {
  PUBLICACAO: "Publicação de Plantão",
  TAXA_RESERVA: "Taxa de Reserva de Plantão",
  RESERVA_SALA: "Reserva de Sala",
};

type Recibo = {
  numero: string;
  pagoEm: string;
  metodo: string;
  valor: number;
  comissao: number;
  estado: string;
  subTipo: string;
  descricao: string;
  pagador: string;
  referencia: string;
};

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className={`text-xs text-right font-semibold text-gray-800 ${mono ? "font-mono tracking-wide" : ""}`}>{value}</span>
    </div>
  );
}

export default function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [recibo, setRecibo] = useState<Recibo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`/api/pagamentos/${id}/recibo`)
      .then((r) => r.ok ? r.json() : r.json().then((d: { error?: string }) => { throw new Error(d.error ?? "Erro"); }))
      .then((d: Recibo) => setRecibo(d))
      .catch((e: Error) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">A carregar...</div>;
  }

  if (erro || !recibo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4">
        <p className="text-red-500 text-sm">{erro || "Comprovativo não encontrado."}</p>
        <button onClick={() => router.back()} className="text-sm text-[#0B3C74] underline">Voltar</button>
      </div>
    );
  }

  const confirmado = recibo.estado === "CONFIRMADO";

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-12 print:bg-white print:pb-0">
      {/* Action bar */}
      <div className="print:hidden flex items-center justify-between px-4 pt-5 pb-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-600 font-medium"
        >
          <ArrowLeft size={16} strokeWidth={2} /> Voltar
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#0B3C74] bg-blue-50 px-3 py-1.5 rounded-xl"
        >
          <Printer size={15} strokeWidth={2} /> Guardar PDF
        </button>
      </div>

      {/* Receipt card */}
      <div className="mx-4 bg-white rounded-3xl overflow-hidden shadow-sm print:shadow-none print:rounded-none print:mx-0">
        {/* Colour stripe */}
        <div className="h-1.5 bg-gradient-to-r from-[#0B3C74] to-[#00A99D]" />

        {/* Brand */}
        <div className="px-6 pt-5 pb-4 text-center border-b border-gray-100">
          <div className="inline-flex items-center gap-2">
            <div className="w-7 h-7 bg-[#0B3C74] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-[10px]">MF</span>
            </div>
            <span className="font-black text-[#0B3C74] text-base tracking-tight">medfreela</span>
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5">
            Comprovativo de Pagamento
          </p>
        </div>

        {/* Status */}
        <div className="px-6 py-5 flex flex-col items-center border-b border-gray-100">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2.5 ${confirmado ? "bg-green-100" : "bg-amber-100"}`}>
            {confirmado
              ? <CheckCircle2 size={28} strokeWidth={1.5} className="text-green-500" />
              : <Clock size={28} strokeWidth={1.5} className="text-amber-500" />}
          </div>
          <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${confirmado ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
            {confirmado ? "✓ Pagamento Confirmado" : "Aguarda Confirmação"}
          </span>
          <p className="text-xs text-gray-400 mt-2">{formatDateTime(recibo.pagoEm)}</p>
        </div>

        {/* Details */}
        <div className="px-6 py-3">
          <Row label="Nº Comprovativo" value={recibo.numero} mono />
          <Row label="Tipo" value={SUBTIPO_LABEL[recibo.subTipo] ?? recibo.subTipo} />
          <Row label="Descrição" value={recibo.descricao} />
          <Row label="Pagador" value={recibo.pagador} />
          <Row label="Método" value={METODO_LABEL[recibo.metodo] ?? recibo.metodo} />
        </div>

        {/* Amount */}
        <div className="mx-6 mb-5 bg-[#f0f6ff] rounded-2xl px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">Valor pago</span>
            <span className="font-bold text-[#0B3C74] text-base">{formatAOA(recibo.valor)}</span>
          </div>
          {recibo.comissao > 0 && (
            <div className="flex justify-between text-xs text-gray-400">
              <span>Inclui comissão Medfreela</span>
              <span>{formatAOA(recibo.comissao)}</span>
            </div>
          )}
        </div>

        {/* Reference + QR mock */}
        <div className="mx-6 mb-5">
          <div className="border border-dashed border-gray-200 rounded-2xl p-4 flex items-center gap-4">
            {/* Simulated QR pattern */}
            <div className="w-14 h-14 shrink-0 p-0.5 bg-white border border-gray-200 rounded-lg grid grid-cols-7 gap-px">
              {Array.from({ length: 49 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-[1px] ${((i * 13 + (i % 7) * 5 + 2) % 3 !== 0) ? "bg-gray-900" : "bg-white"}`}
                />
              ))}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Referência</p>
              <p className="font-mono text-xs font-bold text-gray-800 break-all leading-5">{recibo.referencia}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3.5">
          <p className="text-[10px] text-gray-400 text-center leading-4">
            Este comprovativo foi gerado automaticamente pela Medfreela.<br />
            O pagamento encontra-se retido em escrow e será libertado após conclusão do serviço.
          </p>
        </div>
      </div>

      {/* Share hint */}
      <p className="print:hidden text-center text-xs text-gray-400 mt-4 px-4">
        Use "Guardar PDF" para descarregar ou partilhar como comprovativo.
      </p>
    </div>
  );
}
