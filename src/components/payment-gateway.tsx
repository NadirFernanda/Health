"use client";
import { useState } from "react";
import { Landmark, Smartphone, CreditCard, Check, Loader2, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

export type MetodoPagamento = "TRANSFERENCIA_BANCARIA" | "MULTICAIXA_EXPRESS" | "TPA";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

// ─── Method selector ──────────────────────────────────────────────────────────

export function MetodoPagamentoSelector({
  value,
  onChange,
}: {
  value: MetodoPagamento;
  onChange: (m: MetodoPagamento) => void;
}) {
  const opcoes: { key: MetodoPagamento; label: string; desc: string; icon: React.ReactNode; badge?: string }[] = [
    {
      key: "MULTICAIXA_EXPRESS",
      label: "Multicaixa Express",
      desc: "Confirmação automática (simulado)",
      icon: <Smartphone size={20} strokeWidth={1.75} />,
      badge: "Teste",
    },
    {
      key: "TPA",
      label: "Cartão / TPA",
      desc: "Confirmação automática (simulado)",
      icon: <CreditCard size={20} strokeWidth={1.75} />,
      badge: "Teste",
    },
    {
      key: "TRANSFERENCIA_BANCARIA",
      label: "Transferência Bancária",
      desc: "Confirmação manual pelo admin",
      icon: <Landmark size={20} strokeWidth={1.75} />,
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Método de pagamento</p>
      {opcoes.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
            value === o.key ? "border-[#0B3C74] bg-blue-50" : "border-gray-100 bg-gray-50 hover:bg-gray-100"
          }`}
        >
          <span className="text-gray-500 shrink-0">{o.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-gray-900">{o.label}</span>
              {o.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 uppercase">
                  {o.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{o.desc}</p>
          </div>
          {value === o.key && <Check size={16} strokeWidth={2.5} className="text-[#0B3C74] shrink-0" />}
        </button>
      ))}
    </div>
  );
}

// ─── Bank transfer info (manual, waits for admin) ─────────────────────────────

export function TransferenciaBancariaInfo({
  pagamentoId,
  valor,
  onVerPlantoes,
}: {
  pagamentoId: string;
  valor: number;
  onVerPlantoes: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-sm text-[#0B3C74] leading-5">
        <p className="font-bold mb-1">Aguarda confirmação do pagamento</p>
        <p>Efectua a transferência bancária abaixo. O plantão/reserva fica activo assim que confirmarmos o pagamento.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Resumo</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total a pagar</span>
          <span className="font-bold text-[#0B3C74]">{formatAOA(valor)}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Dados para transferência</p>
        <p className="flex items-center gap-2 text-sm text-gray-700">
          <Landmark size={14} strokeWidth={1.75} className="text-gray-400 shrink-0" />
          <span>NIB: <strong>0040 0000 12345 67890 10 1</strong></span>
        </p>
        <p className="text-xs text-gray-500">Banco: BAI · Titular: Medfreela Lda</p>
        <p className="text-xs text-gray-500">
          Referência: <strong className="font-mono">{pagamentoId.slice(-10).toUpperCase()}</strong>
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-start gap-2 text-xs text-blue-700">
        <Clock size={13} strokeWidth={2} className="shrink-0 mt-0.5" />
        O pagamento é retido na plataforma e só libertado após conclusão do serviço.
      </div>

      <button onClick={onVerPlantoes} className="w-full bg-[#0B3C74] text-white font-bold py-4 rounded-2xl">
        Ver os meus plantões
      </button>
    </div>
  );
}

// ─── Simulated gateway form ───────────────────────────────────────────────────

type SimulatedState = "form" | "processando" | "sucesso" | "erro";

export function SimulatedPaymentGateway({
  pagamentoId,
  metodo,
  valor,
  onSucesso,
  onErro,
}: {
  pagamentoId: string;
  metodo: "MULTICAIXA_EXPRESS" | "TPA";
  valor: number;
  onSucesso: (mensagem: string) => void;
  onErro: (mensagem: string) => void;
}) {
  const [state, setState] = useState<SimulatedState>("form");
  const [telefone, setTelefone] = useState("");
  const [cartao, setCartao] = useState("");
  const [expiracao, setExpiracao] = useState("");
  const [cvv, setCvv] = useState("");
  const [mensagem, setMensagem] = useState("");

  const formatCartao = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiracao = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const processar = async () => {
    setState("processando");
    // Simular delay de processamento
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const res = await fetch(`/api/pagamentos/${pagamentoId}/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metodo,
          ...(metodo === "MULTICAIXA_EXPRESS" ? { telefone } : { cartao: cartao.replace(/\s/g, ""), expiracao, cvv }),
        }),
      });

      const data = await res.json() as { sucesso?: boolean; mensagem?: string; error?: string };

      if (res.ok && data.sucesso) {
        setMensagem(data.mensagem ?? "Pagamento aprovado!");
        setState("sucesso");
        onSucesso(data.mensagem ?? "Pagamento aprovado!");
      } else {
        const msg = data.mensagem ?? data.error ?? "Pagamento recusado.";
        setMensagem(msg);
        setState("erro");
        onErro(msg);
      }
    } catch {
      setMensagem("Erro de ligação. Tente novamente.");
      setState("erro");
      onErro("Erro de ligação.");
    }
  };

  if (state === "processando") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 size={40} className="animate-spin text-[#0B3C74]" strokeWidth={1.5} />
        <p className="font-semibold text-gray-700 text-sm">A processar pagamento…</p>
        <p className="text-xs text-gray-400">Por favor aguarde</p>
      </div>
    );
  }

  if (state === "sucesso") {
    return (
      <div className="flex flex-col items-center py-8 gap-3 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 size={32} strokeWidth={1.5} className="text-green-500" />
        </div>
        <p className="font-bold text-gray-900">Pagamento aprovado!</p>
        <p className="text-xs text-gray-500">{mensagem}</p>
        <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
          O pagamento está retido em escrow e será libertado após a conclusão do serviço.
        </p>
      </div>
    );
  }

  if (state === "erro") {
    return (
      <div className="flex flex-col items-center py-8 gap-3 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle size={32} strokeWidth={1.5} className="text-red-500" />
        </div>
        <p className="font-bold text-gray-900">Pagamento recusado</p>
        <p className="text-xs text-red-500">{mensagem}</p>
        <button onClick={() => setState("form")} className="mt-2 text-sm text-[#0B3C74] underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  // Form
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Resumo</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total</span>
          <span className="font-bold text-[#0B3C74]">{formatAOA(valor)}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 uppercase">Simulado</span>
          <span className="text-xs text-gray-400">Nenhum valor real é cobrado</span>
        </div>
      </div>

      {metodo === "MULTICAIXA_EXPRESS" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Número de telemóvel</p>
          <input
            type="tel"
            placeholder="923 456 789"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0B3C74]"
          />
          <p className="text-xs text-gray-400">9 dígitos começando por 9. Use "FALHAR" para testar recusa.</p>
        </div>
      )}

      {metodo === "TPA" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Dados do cartão (fictício)</p>
          <input
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cartao}
            onChange={(e) => setCartao(formatCartao(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#0B3C74]"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Validade</label>
              <input
                type="text"
                placeholder="MM/AA"
                value={expiracao}
                onChange={(e) => setExpiracao(formatExpiracao(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0B3C74]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">CVV</label>
              <input
                type="text"
                placeholder="123"
                maxLength={3}
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0B3C74]"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">Use qualquer nº fictício de 16 dígitos. Comece por "0000" para testar recusa.</p>
        </div>
      )}

      <button
        onClick={processar}
        disabled={
          (metodo === "MULTICAIXA_EXPRESS" && !telefone) ||
          (metodo === "TPA" && (cartao.replace(/\s/g, "").length < 16 || !expiracao || cvv.length < 3))
        }
        className="w-full bg-[#00A99D] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2"
      >
        <CheckCircle2 size={16} strokeWidth={2} />
        PAGAR {formatAOA(valor)}
      </button>
    </div>
  );
}
