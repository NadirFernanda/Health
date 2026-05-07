"use client";
import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/nav";
import { TrendingUp, ArrowUp, X, AlertTriangle, CheckCircle2, Loader2, ArrowDownToLine } from "lucide-react";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-PT").format(Math.round(v)) + " AOA";
}

type Transacao = {
  id: string;
  tipo: string;
  descricao: string;
  estado: string;
  criadoEm: string;
  valorAoa: number;
};

type Saque = {
  id: string;
  valorAoa: number;
  estado: string;
  dadosBancarios: { banco: string; titular: string; iban: string };
  motivoRejeicao: string | null;
  criadoEm: string;
  processadoEm: string | null;
};

type CarteiraData = {
  saldo: number;
  pendente: number;
  transacoes: Transacao[];
  saques: Saque[];
};

const ESTADO_SAQUE: Record<string, { label: string; cls: string }> = {
  PENDENTE:  { label: "Pendente",  cls: "bg-yellow-100 text-yellow-700" },
  APROVADO:  { label: "Aprovado",  cls: "bg-green-100 text-green-700" },
  REJEITADO: { label: "Rejeitado", cls: "bg-red-100 text-red-700" },
  CANCELADO: { label: "Cancelado", cls: "bg-gray-100 text-gray-500" },
};

const BANCOS_AO = [
  "Banco Angolano de Investimentos (BAI)",
  "Banco de Fomento Angola (BFA)",
  "Banco BIC Angola",
  "Banco Millennium Atlântico",
  "Standard Bank Angola",
  "Banco Caixa Geral Angola (BCGA)",
  "First National Bank (FNB)",
  "Banco Yetu",
  "Outro",
];

export default function GanhosMedico() {
  const [data, setData] = useState<CarteiraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"movimentos" | "saques">("movimentos");
  const [showForm, setShowForm] = useState(false);

  // Withdrawal form state
  const [valor, setValor] = useState("");
  const [banco, setBanco] = useState("");
  const [titular, setTitular] = useState("");
  const [iban, setIban] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSucesso, setFormSucesso] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/carteira", { credentials: "include" });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const temSaquePendente = data?.saques.some((s) => s.estado === "PENDENTE") ?? false;

  async function handleSolicitarSaque(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const v = parseFloat(valor);
    if (!v || v < 1000) { setFormError("Valor mínimo: 1.000 AOA"); return; }
    if (!banco) { setFormError("Selecciona o banco"); return; }
    if (!titular.trim()) { setFormError("Nome do titular obrigatório"); return; }
    if (!iban.trim()) { setFormError("IBAN / número de conta obrigatório"); return; }

    setFormLoading(true);
    try {
      const res = await fetch("/api/carteira/saques", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor: v, dadosBancarios: { banco, titular, iban } }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFormError((d as { error?: string }).error ?? "Erro ao submeter pedido.");
        return;
      }
      setFormSucesso(true);
      await carregar();
    } catch {
      setFormError("Erro de ligação. Tente novamente.");
    } finally {
      setFormLoading(false);
    }
  }

  function resetForm() {
    setValor(""); setBanco(""); setTitular(""); setIban("");
    setFormError(""); setFormSucesso(false); setShowForm(false);
  }

  if (loading) {
    return (
      <div>
        <TopBar titulo="Meus Ganhos" back="/medico" />
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#0B3C74]" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar titulo="Meus Ganhos" back="/medico" />

      {/* Saldo card */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] px-5 py-6 mx-4 mt-4 rounded-2xl">
        <p className="text-blue-200 text-sm">Saldo disponível</p>
        <p className="text-white text-4xl font-bold mt-1">{formatAOA(data?.saldo ?? 0)}</p>
        {(data?.pendente ?? 0) > 0 && (
          <p className="text-blue-200 text-xs mt-2">
            ⏳ {formatAOA(data!.pendente)} em processamento
          </p>
        )}
        <button
          onClick={() => { setShowForm(true); setFormSucesso(false); setFormError(""); }}
          disabled={temSaquePendente}
          className="mt-4 bg-white text-[#0B3C74] font-bold text-sm px-5 py-2.5 rounded-xl w-full disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ArrowDownToLine size={15} strokeWidth={2} />
          {temSaquePendente ? "LEVANTAMENTO PENDENTE" : "LEVANTAR SALDO"}
        </button>
      </div>

      {/* Withdrawal form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto pb-8">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Levantar Saldo</h2>
              <button onClick={resetForm} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {formSucesso ? (
              <div className="flex flex-col items-center py-6 gap-3 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={28} strokeWidth={1.5} className="text-green-500" />
                </div>
                <p className="font-bold text-gray-900">Pedido submetido!</p>
                <p className="text-xs text-gray-500">O teu pedido de levantamento foi recebido e será processado em 1–3 dias úteis.</p>
                <button
                  onClick={resetForm}
                  className="w-full bg-[#0B3C74] text-white font-bold py-3.5 rounded-2xl text-sm mt-2"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSolicitarSaque} className="space-y-3">
                <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                  Saldo disponível: <strong>{formatAOA(data?.saldo ?? 0)}</strong>. O valor será transferido para a conta indicada em 1–3 dias úteis após aprovação.
                </p>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Valor a levantar (AOA)</label>
                  <input
                    type="number"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="ex: 50000"
                    min="1000"
                    max={data?.saldo ?? 0}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Banco</label>
                  <select
                    value={banco}
                    onChange={(e) => setBanco(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/20 bg-white"
                  >
                    <option value="">Seleccionar banco</option>
                    {BANCOS_AO.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Titular da conta</label>
                  <input
                    type="text"
                    value={titular}
                    onChange={(e) => setTitular(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">IBAN / Número de conta</label>
                  <input
                    type="text"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="AO06 0040 0000 0000 0000 1"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/20"
                  />
                </div>

                {formError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600">
                    <AlertTriangle size={13} strokeWidth={2} />
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-[#0B3C74] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {formLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} strokeWidth={2} />}
                  {formLoading ? "A submeter…" : "SOLICITAR LEVANTAMENTO"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-5">
        {(["movimentos", "saques"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              tab === t ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t === "movimentos" ? "Movimentos" : `Levantamentos (${data?.saques.length ?? 0})`}
          </button>
        ))}
      </div>

      <div className="px-4 pt-3 pb-28">
        {tab === "movimentos" && (
          <>
            {(data?.transacoes.length ?? 0) === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <TrendingUp size={36} className="mx-auto mb-2 text-gray-300" strokeWidth={1.25} />
                <p className="text-sm">Ainda não tens movimentos na carteira.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data!.transacoes.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      t.tipo === "CREDITO" ? "bg-green-50" : "bg-gray-100"
                    }`}>
                      {t.tipo === "CREDITO"
                        ? <TrendingUp size={18} strokeWidth={1.75} className="text-green-600" />
                        : <ArrowUp size={18} strokeWidth={1.75} className="text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{t.descricao}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(t.criadoEm).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-sm ${t.tipo === "CREDITO" ? "text-[#00A99D]" : "text-gray-600"}`}>
                        {t.tipo === "CREDITO" ? "+" : "−"}{formatAOA(t.valorAoa)}
                      </p>
                      {t.estado === "PENDENTE" && (
                        <span className="text-xs text-yellow-600 font-medium">Pendente</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "saques" && (
          <>
            {(data?.saques.length ?? 0) === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ArrowDownToLine size={36} className="mx-auto mb-2 text-gray-300" strokeWidth={1.25} />
                <p className="text-sm">Ainda não fizeste nenhum pedido de levantamento.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data!.saques.map((s) => {
                  const cfg = ESTADO_SAQUE[s.estado] ?? ESTADO_SAQUE.PENDENTE;
                  return (
                    <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm text-gray-900">{formatAOA(s.valorAoa)}</p>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{s.dadosBancarios.banco}</p>
                      <p className="text-xs text-gray-400 font-mono">{s.dadosBancarios.iban}</p>
                      {s.motivoRejeicao && (
                        <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{s.motivoRejeicao}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Pedido em {new Date(s.criadoEm).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                        {s.processadoEm && ` · Processado em ${new Date(s.processadoEm).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
