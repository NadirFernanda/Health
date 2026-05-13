"use client";
import { useEffect, useState, useCallback } from "react";
import { Check, X, Loader2, Building2, User, Calendar, CreditCard, Stethoscope } from "lucide-react";

type Candidatura = {
  id: string;
  estado: string;
  medicoNome: string;
  medicoEspecialidade: string;
  plantaoEspecialidade: string;
  plantaoData: string;
  publicadoPor: string;
};

type Pagamento = {
  id: string;
  tipo: "TURNO" | "SALA";
  subtipo: "PUBLICACAO" | "TAXA_RESERVA";
  estado: "PENDENTE" | "CONFIRMADO";
  valorBrutoAoa: number;
  comissaoAoa: number;
  valorLiquidoAoa: number;
  metodo: string;
  criadoEm: string;
  pagoEm: string | null;
  plantao: {
    especialidade: string;
    dataInicio: string;
    valorKwanzas: number;
    estado: string;
    publicadoPor: string;
  } | null;
  candidatura: Candidatura | null;
  reservaSala: {
    data: string;
    horaInicio: string;
    duracaoHoras: number;
    valorTotal: number;
    estado: string;
    salaNome: string;
    clinicaNome: string;
    medicoNome: string;
  } | null;
};

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

const METODO_LABEL: Record<string, string> = {
  MULTICAIXA_EXPRESS: "Multicaixa Express",
  TRANSFERENCIA_BANCARIA: "Transferência Bancária",
};

const SUBTIPO_CONFIG = {
  PUBLICACAO: { label: "PUBLICAÇÃO", cls: "bg-blue-100 text-blue-700" },
  TAXA_RESERVA: { label: "TAXA RESERVA", cls: "bg-[#0B3C74]/10 text-[#0B3C74]" },
} as const;

export default function AdminPagamentos() {
  const [lista, setLista] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"PENDENTE" | "CONFIRMADO">("PENDENTE");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; msg: string } | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/pagamentos", { credentials: "include" });
      const body = await r.json();
      if (Array.isArray(body)) setLista(body);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const acao = async (id: string, a: "CONFIRMAR" | "REJEITAR") => {
    setActionLoading(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/pagamentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ acao: a }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setActionError({ id, msg: (body as { error?: string }).error ?? `Erro HTTP ${res.status}` });
        return;
      }
      await carregar();
    } catch {
      setActionError({ id, msg: "Erro de ligação." });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = lista.filter((p) => p.estado === filtro);
  const pendentes = lista.filter((p) => p.estado === "PENDENTE").length;
  const confirmados = lista.filter((p) => p.estado === "CONFIRMADO").length;

  return (
    <div className="p-4 space-y-4 pb-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900">Pagamentos em Escrow</h1>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(["PENDENTE", "CONFIRMADO"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filtro === f ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "PENDENTE" ? `Por confirmar (${pendentes})` : `Em escrow (${confirmados})`}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
          {filtro === "PENDENTE" ? "Nenhum pagamento pendente." : "Nenhum pagamento em escrow."}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((p) => {
          const subtipoConfig = SUBTIPO_CONFIG[p.subtipo] ?? SUBTIPO_CONFIG.PUBLICACAO;
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.tipo === "TURNO" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"
                    }`}>
                      {p.tipo === "TURNO" ? "PLANTÃO" : "SALA"}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${subtipoConfig.cls}`}>
                      {subtipoConfig.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Submetido {new Date(p.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-[#0B3C74]">{formatAOA(p.valorBrutoAoa)}</p>
                  <p className="text-[10px] text-gray-400">Comissão: {formatAOA(p.comissaoAoa)}</p>
                  {p.valorLiquidoAoa > 0 && (
                    <p className="text-[10px] text-gray-500">Líquido: {formatAOA(p.valorLiquidoAoa)}</p>
                  )}
                </div>
              </div>

              {/* Taxa de reserva do médico */}
              {p.candidatura && (
                <div className="bg-[#0B3C74]/5 rounded-xl p-3 space-y-1 text-xs text-gray-600">
                  <p className="flex items-center gap-1.5 font-semibold text-gray-800">
                    <Stethoscope size={12} strokeWidth={1.75} className="text-[#0B3C74]/60" />
                    {p.candidatura.medicoNome} · {p.candidatura.medicoEspecialidade}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar size={12} strokeWidth={1.75} className="text-gray-400" />
                    Plantão de {p.candidatura.plantaoEspecialidade} · {new Date(p.candidatura.plantaoData).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Building2 size={12} strokeWidth={1.75} className="text-gray-400" />
                    {p.candidatura.publicadoPor}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CreditCard size={12} strokeWidth={1.75} className="text-gray-400" />
                    {METODO_LABEL[p.metodo] ?? p.metodo}
                  </p>
                </div>
              )}

              {/* Publicação de plantão */}
              {p.plantao && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs text-gray-600">
                  <p className="flex items-center gap-1.5 font-semibold text-gray-800">
                    <Building2 size={12} strokeWidth={1.75} className="text-gray-400" />
                    {p.plantao.publicadoPor}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar size={12} strokeWidth={1.75} className="text-gray-400" />
                    {p.plantao.especialidade} · {new Date(p.plantao.dataInicio).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CreditCard size={12} strokeWidth={1.75} className="text-gray-400" />
                    {METODO_LABEL[p.metodo] ?? p.metodo}
                  </p>
                </div>
              )}

              {/* Reserva de sala */}
              {p.reservaSala && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs text-gray-600">
                  <p className="flex items-center gap-1.5 font-semibold text-gray-800">
                    <User size={12} strokeWidth={1.75} className="text-gray-400" />
                    {p.reservaSala.medicoNome}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Building2 size={12} strokeWidth={1.75} className="text-gray-400" />
                    {p.reservaSala.salaNome} · {p.reservaSala.clinicaNome}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar size={12} strokeWidth={1.75} className="text-gray-400" />
                    {new Date(p.reservaSala.data).toLocaleDateString("pt-AO")} às {p.reservaSala.horaInicio} · {p.reservaSala.duracaoHoras}h
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CreditCard size={12} strokeWidth={1.75} className="text-gray-400" />
                    {METODO_LABEL[p.metodo] ?? p.metodo}
                  </p>
                </div>
              )}

              {actionError?.id === p.id && (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{actionError.msg}</p>
              )}

              {p.estado === "PENDENTE" && (
                <div className="flex gap-2">
                  <button
                    disabled={actionLoading === p.id}
                    onClick={() => acao(p.id, "CONFIRMAR")}
                    className="flex-1 bg-[#00A99D] hover:bg-[#009082] disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    {actionLoading === p.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Check size={13} strokeWidth={2.5} />}
                    CONFIRMAR PAGAMENTO
                  </button>
                  <button
                    disabled={actionLoading === p.id}
                    onClick={() => acao(p.id, "REJEITAR")}
                    className="flex-1 border border-red-200 hover:bg-red-50 disabled:opacity-50 text-red-500 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <X size={13} strokeWidth={2.5} /> REJEITAR
                  </button>
                </div>
              )}

              {p.estado === "CONFIRMADO" && (
                <p className="text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2 text-center font-semibold">
                  {p.subtipo === "TAXA_RESERVA"
                    ? "Taxa de reserva confirmada — médico activo no plantão."
                    : "Pagamento em escrow — será libertado após conclusão do serviço."}
                  {p.pagoEm && ` Confirmado em ${new Date(p.pagoEm).toLocaleDateString("pt-AO")}.`}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
