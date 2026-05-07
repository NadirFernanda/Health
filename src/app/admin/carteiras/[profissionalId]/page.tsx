"use client";
import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TrendingUp, ArrowUp, ArrowDownToLine, PlusCircle, MinusCircle, ChevronLeft, AlertTriangle, CheckCircle2 } from "lucide-react";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(Math.round(v)) + " AOA";
}

type Transacao = {
  id: string;
  tipo: string;
  descricao: string;
  estado: string;
  criadoEm: string;
  valorAoa: number;
  referencia: string | null;
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

type CarteiraDetalhe = {
  id: string;
  nome: string;
  especialidade: string;
  email: string;
  telefone: string | null;
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

export default function AdminCarteiraDetalhe({ params }: { params: Promise<{ profissionalId: string }> }) {
  const { profissionalId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<CarteiraDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"movimentos" | "saques">("movimentos");

  // Adjustment form
  const [showAjuste, setShowAjuste] = useState(false);
  const [ajusteTipo, setAjusteTipo] = useState<"CREDITO" | "DEBITO">("CREDITO");
  const [ajusteValor, setAjusteValor] = useState("");
  const [ajusteMotivo, setAjusteMotivo] = useState("");
  const [ajusteLoading, setAjusteLoading] = useState(false);
  const [ajusteError, setAjusteError] = useState("");
  const [ajusteSucesso, setAjusteSucesso] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/carteiras/${profissionalId}`, { credentials: "include" });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, [profissionalId]);

  useEffect(() => { carregar(); }, [carregar]);

  async function handleAjuste(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAjusteError("");
    const v = parseFloat(ajusteValor);
    if (!v || v <= 0) { setAjusteError("Valor inválido"); return; }
    if (!ajusteMotivo.trim()) { setAjusteError("Motivo obrigatório"); return; }

    setAjusteLoading(true);
    try {
      const res = await fetch(`/api/admin/carteiras/${profissionalId}/ajuste`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: ajusteTipo, valor: v, motivo: ajusteMotivo }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setAjusteError((d as { error?: string }).error ?? "Erro ao efectuar ajuste.");
        return;
      }
      setAjusteSucesso(true);
      await carregar();
      setTimeout(() => { setShowAjuste(false); setAjusteSucesso(false); setAjusteValor(""); setAjusteMotivo(""); }, 1500);
    } catch {
      setAjusteError("Erro de ligação.");
    } finally {
      setAjusteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#0B3C74]" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-4 text-sm text-gray-500">Profissional não encontrado.</div>;
  }

  return (
    <div className="p-4 space-y-4 pb-10 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="p-1.5 text-gray-400 hover:text-gray-600">
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <div>
          <h1 className="text-base font-bold text-gray-900">{data.nome}</h1>
          <p className="text-xs text-gray-400">{data.especialidade} · {data.email}</p>
        </div>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] rounded-2xl px-5 py-5">
        <p className="text-blue-200 text-xs">Saldo disponível</p>
        <p className="text-white text-3xl font-bold mt-0.5">{formatAOA(data.saldo)}</p>
        {data.pendente > 0 && (
          <p className="text-blue-200 text-xs mt-1">⏳ {formatAOA(data.pendente)} pendente</p>
        )}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => { setAjusteTipo("CREDITO"); setShowAjuste(true); setAjusteSucesso(false); setAjusteError(""); }}
            className="flex-1 bg-white/20 text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 hover:bg-white/30 transition-colors"
          >
            <PlusCircle size={13} strokeWidth={2} /> Creditar
          </button>
          <button
            onClick={() => { setAjusteTipo("DEBITO"); setShowAjuste(true); setAjusteSucesso(false); setAjusteError(""); }}
            className="flex-1 bg-white/20 text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 hover:bg-white/30 transition-colors"
          >
            <MinusCircle size={13} strokeWidth={2} /> Debitar
          </button>
        </div>
      </div>

      {/* Adjustment modal */}
      {showAjuste && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <h2 className="font-bold text-gray-900">{ajusteTipo === "CREDITO" ? "Creditar" : "Debitar"} carteira</h2>
            {ajusteSucesso ? (
              <div className="flex flex-col items-center py-4 gap-2 text-center">
                <CheckCircle2 size={32} className="text-green-500" strokeWidth={1.5} />
                <p className="font-semibold text-gray-900">Ajuste efectuado!</p>
              </div>
            ) : (
              <form onSubmit={handleAjuste} className="space-y-3">
                <div className="flex gap-2">
                  {(["CREDITO", "DEBITO"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAjusteTipo(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        ajusteTipo === t ? "bg-[#0B3C74] text-white border-[#0B3C74]" : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {t === "CREDITO" ? "+ Crédito" : "− Débito"}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Valor (AOA)</label>
                  <input
                    type="number"
                    value={ajusteValor}
                    onChange={(e) => setAjusteValor(e.target.value)}
                    placeholder="ex: 10000"
                    min="1"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Motivo (ficará registado)</label>
                  <textarea
                    value={ajusteMotivo}
                    onChange={(e) => setAjusteMotivo(e.target.value)}
                    placeholder="ex: Correcção de pagamento duplicado"
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/20 resize-none"
                  />
                </div>
                {ajusteError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600">
                    <AlertTriangle size={13} strokeWidth={2} /> {ajusteError}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAjuste(false)}
                    className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-3 rounded-2xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={ajusteLoading}
                    className="flex-1 bg-[#0B3C74] text-white text-sm font-bold py-3 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {ajusteLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                    Confirmar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(["movimentos", "saques"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              tab === t ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t === "movimentos" ? `Movimentos (${data.transacoes.length})` : `Levantamentos (${data.saques.length})`}
          </button>
        ))}
      </div>

      {tab === "movimentos" && (
        <div className="space-y-2">
          {data.transacoes.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Sem movimentos.</div>
          ) : data.transacoes.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                t.tipo === "CREDITO" ? "bg-green-50" : "bg-gray-100"
              }`}>
                {t.tipo === "CREDITO"
                  ? <TrendingUp size={16} strokeWidth={1.75} className="text-green-600" />
                  : <ArrowUp size={16} strokeWidth={1.75} className="text-gray-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{t.descricao}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {new Date(t.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                  {t.referencia && ` · ${t.referencia}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-bold text-xs ${t.tipo === "CREDITO" ? "text-[#00A99D]" : "text-gray-600"}`}>
                  {t.tipo === "CREDITO" ? "+" : "−"}{formatAOA(t.valorAoa)}
                </p>
                {t.estado === "PENDENTE" && <span className="text-[10px] text-yellow-600 font-medium">Pendente</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "saques" && (
        <div className="space-y-2">
          {data.saques.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              <ArrowDownToLine size={28} className="mx-auto mb-2 text-gray-300" strokeWidth={1.25} />
              Sem pedidos de levantamento.
            </div>
          ) : data.saques.map((s) => {
            const cfg = ESTADO_SAQUE[s.estado] ?? ESTADO_SAQUE.PENDENTE;
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-gray-900">{formatAOA(s.valorAoa)}</p>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                </div>
                <p className="text-xs text-gray-500">{s.dadosBancarios.banco} · {s.dadosBancarios.titular}</p>
                <p className="text-xs text-gray-400 font-mono">{s.dadosBancarios.iban}</p>
                {s.motivoRejeicao && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-1.5">{s.motivoRejeicao}</p>
                )}
                <p className="text-[11px] text-gray-400">
                  {new Date(s.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                  {s.processadoEm && ` · Proc. ${new Date(s.processadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
