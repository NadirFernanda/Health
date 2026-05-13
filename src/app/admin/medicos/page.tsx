"use client";
import { useEffect, useState, useCallback } from "react";
import { Check, X, Star, ClipboardList, MessageCircle, Ban, RotateCcw, Wallet, FileText, ExternalLink, Loader2, UserCheck, Search } from "lucide-react";

type EstadoVerificacao = "APROVADO" | "PENDENTE" | "EM_ANALISE" | "REJEITADO" | "SUSPENSO";
type Filtro = "TODOS" | "PENDENTE" | "EM_ANALISE" | "APROVADO" | "REJEITADO" | "SUSPENSO";

type Documento = { id: string; tipo: string; estado: string; ficheiro: string };

type Medico = {
  id: string; userId: string; nome: string; email: string; especialidade: string; provincia: string;
  numeroOrdem: string; rating: number; totalAvaliacoes: number; totalPlantoes: number;
  verified: boolean; estadoVerificacao: EstadoVerificacao; saldoCarteira: number; criadoEm: string;
  documentos: Documento[];
};

const DOC_LABELS: Record<string, string> = {
  CEDULA_OMA:    "Carteira OMA",
  BI_PASSAPORTE: "BI / Passaporte",
  CURRICULO:     "Currículo",
};

const DOC_ESTADO: Record<string, { cls: string; label: string }> = {
  PENDENTE:  { cls: "bg-yellow-100 text-yellow-700", label: "Pendente"  },
  APROVADO:  { cls: "bg-green-100 text-green-700",   label: "Aprovado"  },
  REJEITADO: { cls: "bg-red-100 text-red-600",       label: "Rejeitado" },
};

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

const badgeMap: Record<EstadoVerificacao, { cls: string; label: string }> = {
  APROVADO:  { cls: "bg-green-100 text-green-700",   label: "Verificado"   },
  PENDENTE:  { cls: "bg-gray-100 text-gray-500",     label: "Sem docs"     },
  EM_ANALISE:{ cls: "bg-yellow-100 text-yellow-700", label: "Em Análise"   },
  REJEITADO: { cls: "bg-red-100 text-red-600",       label: "Rejeitado"    },
  SUSPENSO:  { cls: "bg-gray-100 text-gray-500",     label: "Suspenso"     },
};

export default function AdminMedicos() {
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [pesquisa, setPesquisa] = useState("");
  const [lista, setLista]   = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // profissional id
  const [actionError, setActionError] = useState<{ id: string; msg: string } | null>(null);
  const [rejecting, setRejecting] = useState<{ id: string; motivo: string } | null>(null);
  const [docLoading, setDocLoading] = useState<string | null>(null); // documentoId

  const carregarLista = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/medicos", { credentials: "include" });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        const details = (body as { details?: string; error?: string }).details
          ?? (body as { error?: string }).error
          ?? `HTTP ${r.status}`;
        throw new Error(details);
      }
      if (Array.isArray(body)) setLista(body);
      else throw new Error("Resposta inesperada de médicos");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[admin/medicos]", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregarLista(); }, [carregarLista]);

  const atualizarDoc = async (medicoId: string, docId: string, a: "APROVAR" | "REJEITAR") => {
    setDocLoading(docId);
    try {
      const res = await fetch(`/api/admin/medicos/documentos/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ acao: a }),
      });
      if (!res.ok) return;
      setLista((prev) =>
        prev.map((m) => {
          if (m.id !== medicoId) return m;
          return {
            ...m,
            documentos: m.documentos.map((d) =>
              d.id === docId ? { ...d, estado: a === "APROVAR" ? "APROVADO" : "REJEITADO" } : d
            ),
          };
        })
      );
    } finally {
      setDocLoading(null);
    }
  };

  const acao = async (id: string, a: string, motivo?: string) => {
    setActionLoading(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/medicos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ acao: a, ...(motivo ? { motivo } : {}) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = (body as { error?: string }).error ?? `Erro HTTP ${res.status}`;
        setActionError({ id, msg });
        return;
      }
      // Reload from server so badge always reflects true DB state
      await carregarLista();
      setRejecting(null);
    } catch {
      setActionError({ id, msg: "Erro de ligação. Tenta novamente." });
    } finally {
      setActionLoading(null);
    }
  };

  const entrarComo = async (id: string) => {
    const res = await fetch("/api/admin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "MEDICO", profileId: id }),
    });
    if (res.ok) {
      const { redirectTo } = await res.json();
      window.location.href = redirectTo;
    }
  };

  const q = pesquisa.toLowerCase();
  const filtered = lista.filter((m) => {
    const matchStatus = filtro === "TODOS" || m.estadoVerificacao === filtro;
    const matchSearch = !q || m.nome.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.especialidade.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });
  const count = (f: Filtro) =>
    f === "TODOS" ? lista.length : lista.filter((m) => m.estadoVerificacao === f).length;

  if (loading) return (
    <div className="p-4 pt-10 flex justify-center">
      <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="p-4 pt-10 flex justify-center">
      <div className="max-w-xl text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
        {error}
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4 pb-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900">Gestão de Profissionais</h1>
        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{lista.length} total</span>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(["TODOS", "EM_ANALISE", "PENDENTE", "APROVADO", "REJEITADO", "SUSPENSO"] as Filtro[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filtro === f ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {{ TODOS: "Todos", EM_ANALISE: "Em Análise", PENDENTE: "Sem docs", APROVADO: "Aprovados", REJEITADO: "Rejeitados", SUSPENSO: "Suspensos" }[f]} ({count(f)})
          </button>
        ))}
      </div>

      {/* Pesquisa */}
      <div className="relative">
        <Search size={15} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Pesquisar por nome, e-mail ou especialidade…"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/20"
        />
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.map((m) => {
          const allDocsApproved = m.documentos.length > 0 && m.documentos.every((d) => d.estado === "APROVADO");
          const noPendingDocs   = m.documentos.length > 0 && m.documentos.every((d) => d.estado !== "PENDENTE");
          return (
          <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-[#0B3C74] text-lg shrink-0">
                {m.nome.split(" ")[1]?.charAt(0) ?? m.nome.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-gray-900">{m.nome}</p>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeMap[m.estadoVerificacao].cls}`}>
                    {badgeMap[m.estadoVerificacao].label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{m.especialidade} · {m.provincia}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{m.numeroOrdem}</p>
                <p className="text-xs text-gray-400">{m.email}</p>
                <p className="text-xs text-gray-300 mt-0.5">
                  Cadastro: {new Date(m.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Estatísticas + carteira */}
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-2.5 border-t border-gray-50">
              {m.totalPlantoes > 0 && (
                <>
                  <span className="flex items-center gap-1 text-xs text-gray-500"><Star size={11} strokeWidth={1.75} /> {m.rating}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500"><ClipboardList size={11} strokeWidth={1.75} /> {m.totalPlantoes} plantões</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500"><MessageCircle size={11} strokeWidth={1.75} /> {m.totalAvaliacoes} avaliações</span>
                </>
              )}
              <span className="flex items-center gap-1 text-xs font-semibold text-[#00A99D] ml-auto">
                <Wallet size={11} strokeWidth={1.75} /> {formatAOA(m.saldoCarteira)}
              </span>
            </div>

            {/* Documentos */}
            {m.documentos?.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-gray-50 space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Documentos</p>
                {m.documentos.map((doc) => {
                  const est = DOC_ESTADO[doc.estado] ?? DOC_ESTADO.PENDENTE;
                  const isLoadingDoc = docLoading === doc.id;
                  return (
                    <div key={doc.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <a
                        href={`/api/admin/medicos/documentos/${doc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 min-w-0 flex-1 group"
                      >
                        <FileText size={13} strokeWidth={1.75} className="text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-700 truncate">{DOC_LABELS[doc.tipo] ?? doc.tipo}</span>
                        <ExternalLink size={10} strokeWidth={2} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                      </a>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${est.cls}`}>{est.label}</span>
                        {doc.estado === "PENDENTE" && (
                          <>
                            <button
                              disabled={isLoadingDoc}
                              onClick={() => atualizarDoc(m.id, doc.id, "APROVAR")}
                              className="text-[10px] font-bold bg-green-100 hover:bg-green-200 text-green-700 px-1.5 py-0.5 rounded-full disabled:opacity-50 transition-colors"
                            >
                              {isLoadingDoc ? <Loader2 size={9} className="animate-spin" /> : "✓"}
                            </button>
                            <button
                              disabled={isLoadingDoc}
                              onClick={() => atualizarDoc(m.id, doc.id, "REJEITAR")}
                              className="text-[10px] font-bold bg-red-100 hover:bg-red-200 text-red-600 px-1.5 py-0.5 rounded-full disabled:opacity-50 transition-colors"
                            >
                              {isLoadingDoc ? <Loader2 size={9} className="animate-spin" /> : "✕"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Acções */}
            {/* Erro de acção inline */}
            {actionError?.id === m.id && (
              <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{actionError.msg}</p>
            )}

            {/* APROVAR / REJEITAR */}
            {(m.estadoVerificacao === "EM_ANALISE" || m.estadoVerificacao === "PENDENTE") && (
              <div className="mt-3 space-y-2">
                {!noPendingDocs && (
                  <p className="text-[10px] text-[#00A99D] bg-teal-50 rounded-xl px-3 py-1.5">
                    Aprova ou rejeita todos os documentos antes de decidir sobre o perfil.
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    disabled={actionLoading === m.id || !allDocsApproved}
                    onClick={() => acao(m.id, "APROVAR")}
                    className="flex-1 bg-[#00A99D] hover:bg-[#009082] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    {actionLoading === m.id
                      ? <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                      : <Check size={13} strokeWidth={2.5} />}
                    APROVAR
                  </button>
                  <button
                    disabled={actionLoading === m.id || !noPendingDocs}
                    onClick={() => setRejecting(rejecting?.id === m.id ? null : { id: m.id, motivo: "" })}
                    className="flex-1 border border-red-200 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed text-red-500 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <X size={13} strokeWidth={2.5} /> REJEITAR
                  </button>
                </div>
                {/* Motivo de rejeição */}
                {rejecting?.id === m.id && (
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={rejecting.motivo}
                      onChange={(e) => setRejecting({ id: m.id, motivo: e.target.value })}
                      placeholder="Motivo da rejeição (obrigatório)..."
                      rows={2}
                      className="flex-1 border border-red-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-red-400 resize-none"
                    />
                    <button
                      disabled={!rejecting.motivo.trim() || actionLoading === m.id}
                      onClick={() => acao(m.id, "REJEITAR", rejecting.motivo.trim())}
                      className="shrink-0 bg-red-500 disabled:opacity-40 text-white text-xs font-bold px-3 py-2 rounded-xl"
                    >
                      {actionLoading === m.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : "Confirmar"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {m.estadoVerificacao === "APROVADO" && (
              <button
                disabled={actionLoading === m.id}
                onClick={() => acao(m.id, "SUSPENDER")}
                className="mt-2.5 w-full border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-50 text-xs font-medium py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                {actionLoading === m.id
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Ban size={13} strokeWidth={2} />}
                Suspender Acesso
              </button>
            )}
            {m.estadoVerificacao === "SUSPENSO" && (
              <button
                disabled={actionLoading === m.id}
                onClick={() => acao(m.id, "REATIVAR")}
                className="mt-2.5 w-full bg-[#0B3C74]/10 hover:bg-[#0B3C74]/20 disabled:opacity-50 text-[#0B3C74] text-xs font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                {actionLoading === m.id
                  ? <Loader2 size={13} className="animate-spin" />
                  : <RotateCcw size={13} strokeWidth={2} />}
                Reactivar Acesso
              </button>
            )}

            <button
              onClick={() => entrarComo(m.id)}
              className="mt-2 w-full border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <UserCheck size={13} strokeWidth={2} />
              Entrar como este médico
            </button>
          </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
            Nenhum médico com este filtro.
          </div>
        )}
      </div>
    </div>
  );
}
