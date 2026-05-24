"use client";
import { useEffect, useState } from "react";
import {
  CheckCircle2, XCircle, Scale, HeadphonesIcon, ArrowDownToLine,
  Clock, Activity, Search, WifiOff,
} from "lucide-react";

type AdminRole = "FINANCEIRO" | "GESTOR" | "SUPORTE" | "ANALISTA" | null;

type MembroEquipa = {
  id: string;
  email: string;
  adminRole: AdminRole;
  adminCargo: string | null;
  adminPhone: string | null;
  criadoEm: string;
  isActive: boolean;
  lastLoginAt: string | null;
  verificacoesAprovadas: number;
  verificacoesRejeitadas: number;
  disputasResolvidas: number;
  ticketsFechados: number;
  saquesAprovados: number;
  saquesRejeitados: number;
  totalAcoes: number;
  totalAcoes7d: number;
  ultimaAcaoEm: string | null;
  acoes: { action: string; detalhes: unknown; criadoEm: string }[];
};

const roleBadge: Record<string, { cls: string; label: string }> = {
  FINANCEIRO: { cls: "bg-blue-100 text-blue-700",        label: "Financeiro" },
  GESTOR:     { cls: "bg-[#0B3C74]/10 text-[#0B3C74]",  label: "Gestor" },
  SUPORTE:    { cls: "bg-teal-100 text-teal-700",         label: "Suporte" },
  ANALISTA:   { cls: "bg-purple-100 text-purple-700",     label: "Analista" },
  MASTER:     { cls: "bg-amber-100 text-amber-700",       label: "Master" },
};

function getRoleBadge(role: AdminRole) {
  return roleBadge[role ?? "MASTER"];
}

function tempoAtras(iso: string | null): string {
  if (!iso) return "nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "agora mesmo";
  if (m < 60) return `há ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ontem";
  if (d < 7)  return `há ${d} dias`;
  if (d < 30) return `há ${Math.floor(d / 7)} sem.`;
  return `há ${Math.floor(d / 30)} meses`;
}

function nivelAtividade(lastLoginAt: string | null, totalAcoes7d: number): "alto" | "medio" | "baixo" | "inativo" {
  if (!lastLoginAt) return "inativo";
  const dias = (Date.now() - new Date(lastLoginAt).getTime()) / 86400000;
  if (dias > 14) return "inativo";
  if (totalAcoes7d >= 10) return "alto";
  if (totalAcoes7d >= 3)  return "medio";
  if (dias <= 3)          return "baixo";
  return "inativo";
}

const nivelCls: Record<string, string> = {
  alto:   "bg-green-500",
  medio:  "bg-yellow-400",
  baixo:  "bg-gray-300",
  inativo: "bg-gray-200",
};

const nivelLabel: Record<string, string> = {
  alto:    "Muito ativo",
  medio:   "Ativo",
  baixo:   "Pouco ativo",
  inativo: "Inativo",
};

function actionLabel(action: string, detalhes: unknown): string {
  const d = detalhes as Record<string, unknown>;
  switch (action) {
    case "admin_verificacao_profissional":
      return `Profissional ${String(d.nome ?? "").split(" ")[0]}: ${d.acao === "APROVAR" ? "aprovado" : d.acao === "REJEITAR" ? "rejeitado" : d.acao === "SUSPENDER" ? "suspenso" : "reativado"}`;
    case "admin_verificacao_clinica":
      return `Clínica ${String(d.nome ?? "").split(" ")[0]}: ${d.acao === "APROVAR" ? "aprovada" : d.acao === "REJEITAR" ? "rejeitada" : d.acao === "SUSPENDER" ? "suspensa" : "reativada"}`;
    case "admin_disputa_atualizada":
      return `Disputa marcada como ${String(d.estado ?? "").toLowerCase()}`;
    case "admin_ticket_atualizado":
      return `Ticket → ${String(d.estadoNovo ?? "").toLowerCase().replace("_", " ")}`;
    case "admin_saque":
      return `Levantamento ${d.acao === "APROVAR" ? "aprovado" : "rejeitado"}`;
    default:
      return action.replace(/_/g, " ");
  }
}

type FiltroAtividade = "TODOS" | "ATIVO" | "INATIVO";

export default function EquipaPage() {
  const [membros, setMembros] = useState<MembroEquipa[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState("");
  const [filtro, setFiltro]     = useState<FiltroAtividade>("TODOS");
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/equipa", { credentials: "include" })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${r.status}`);
        return body as MembroEquipa[];
      })
      .then(setMembros)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const q = pesquisa.toLowerCase();
  const filtrados = membros.filter((m) => {
    const nivel = nivelAtividade(m.lastLoginAt, m.totalAcoes7d);
    const matchFiltro =
      filtro === "TODOS" ||
      (filtro === "ATIVO" && nivel !== "inativo") ||
      (filtro === "INATIVO" && nivel === "inativo");
    const matchSearch = !q || m.email.toLowerCase().includes(q) || (m.adminCargo ?? "").toLowerCase().includes(q);
    return matchFiltro && matchSearch;
  });

  // Summary totals
  const totalAcoes7d     = membros.reduce((s, m) => s + m.totalAcoes7d, 0);
  const totalVerificacoes = membros.reduce((s, m) => s + m.verificacoesAprovadas + m.verificacoesRejeitadas, 0);
  const totalDisputas    = membros.reduce((s, m) => s + m.disputasResolvidas, 0);
  const totalTickets     = membros.reduce((s, m) => s + m.ticketsFechados, 0);

  if (loading) return (
    <div className="p-4 pt-10 flex justify-center">
      <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="p-4 pt-10 flex justify-center">
      <div className="max-w-xl text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl p-4 text-center">{error}</div>
    </div>
  );

  return (
    <div className="p-4 space-y-4 pb-10 max-w-3xl mx-auto">

      {/* Header */}
      <div className="pt-1">
        <h1 className="text-base font-bold text-gray-900">Actividade da Equipa</h1>
        <p className="text-xs text-gray-400 mt-0.5">Últimos 30 dias · {membros.length} membros</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Acções (7d)",    value: totalAcoes7d,     icon: Activity,         cls: "text-[#0B3C74]" },
          { label: "Verificações",   value: totalVerificacoes, icon: CheckCircle2,     cls: "text-green-600" },
          { label: "Disputas",       value: totalDisputas,    icon: Scale,            cls: "text-orange-500" },
          { label: "Tickets fechados", value: totalTickets,   icon: HeadphonesIcon,   cls: "text-teal-600" },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
            <Icon size={16} className={`mx-auto mb-1 ${cls}`} strokeWidth={1.75} />
            <p className="text-lg font-bold text-gray-900">{value}</p>
            <p className="text-[10px] text-gray-400 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["TODOS", "ATIVO", "INATIVO"] as FiltroAtividade[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filtro === f ? "bg-[#0B3C74] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "TODOS" ? "Todos" : f === "ATIVO" ? "Activos" : "Inactivos"}
          </button>
        ))}
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Pesquisar…"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B3C74]/20"
          />
        </div>
      </div>

      {/* Member cards */}
      <div className="space-y-3">
        {filtrados.map((m) => {
          const nivel   = nivelAtividade(m.lastLoginAt, m.totalAcoes7d);
          const badge   = getRoleBadge(m.adminRole);
          const aberto  = expandido === m.id;

          return (
            <div
              key={m.id}
              className={`bg-white rounded-2xl border transition-colors ${
                !m.isActive ? "border-gray-100 opacity-60" : "border-gray-100"
              }`}
            >
              {/* Main row */}
              <button
                onClick={() => setExpandido(aberto ? null : m.id)}
                className="w-full text-left p-4"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar + dot */}
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-[#0B3C74]/10 flex items-center justify-center text-sm font-bold text-[#0B3C74]">
                      {m.email[0].toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${nivelCls[nivel]}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{m.email}</p>
                      <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {!m.isActive && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-400">
                          <WifiOff size={9} /> Inativo
                        </span>
                      )}
                    </div>
                    {m.adminCargo && (
                      <p className="text-xs text-gray-400 mt-0.5">{m.adminCargo}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                        nivel === "alto" ? "bg-green-50 text-green-600" :
                        nivel === "medio" ? "bg-yellow-50 text-yellow-600" :
                        nivel === "baixo" ? "bg-gray-100 text-gray-500" :
                        "bg-gray-100 text-gray-400"
                      }`}>
                        {nivelLabel[nivel]}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={10} /> Último acesso: {tempoAtras(m.lastLoginAt)}
                      </span>
                      {m.ultimaAcaoEm && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Activity size={10} /> Última acção: {tempoAtras(m.ultimaAcaoEm)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 7-day count */}
                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold text-gray-900">{m.totalAcoes7d}</p>
                    <p className="text-[10px] text-gray-400">acções/7d</p>
                  </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[
                    {
                      icon: CheckCircle2,
                      cls: "text-green-500",
                      value: m.verificacoesAprovadas,
                      label: "Aprovações",
                    },
                    {
                      icon: XCircle,
                      cls: "text-red-400",
                      value: m.verificacoesRejeitadas,
                      label: "Rejeições",
                    },
                    {
                      icon: Scale,
                      cls: "text-orange-500",
                      value: m.disputasResolvidas,
                      label: "Disputas",
                    },
                    {
                      icon: HeadphonesIcon,
                      cls: "text-teal-500",
                      value: m.ticketsFechados,
                      label: "Tickets",
                    },
                  ].map(({ icon: Icon, cls, value, label }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-2 text-center">
                      <Icon size={13} className={`mx-auto mb-0.5 ${cls}`} strokeWidth={1.75} />
                      <p className="text-sm font-bold text-gray-800">{value}</p>
                      <p className="text-[9px] text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Saques row (only if non-zero) */}
                {(m.saquesAprovados + m.saquesRejeitados > 0) && (
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-500">
                    <ArrowDownToLine size={12} strokeWidth={1.75} className="text-blue-500" />
                    Levantamentos: {m.saquesAprovados} aprovados · {m.saquesRejeitados} rejeitados
                  </div>
                )}
              </button>

              {/* Expanded: recent actions */}
              {aberto && m.acoes.length > 0 && (
                <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Últimas acções (30 dias)</p>
                  <div className="space-y-1.5">
                    {m.acoes.map((a, i) => (
                      <div key={i} className="flex items-center justify-between gap-3">
                        <p className="text-xs text-gray-700">{actionLabel(a.action, a.detalhes)}</p>
                        <p className="text-[10px] text-gray-400 shrink-0">{tempoAtras(a.criadoEm)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aberto && m.acoes.length === 0 && (
                <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                  <p className="text-xs text-gray-400">Nenhuma acção registada nos últimos 30 dias.</p>
                </div>
              )}
            </div>
          );
        })}

        {filtrados.length === 0 && (
          <div className="text-center py-14 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
            Nenhum membro encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
