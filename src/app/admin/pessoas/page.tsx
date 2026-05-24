"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, Stethoscope, Building2, DoorOpen,
  BadgeCheck, Clock, XCircle, AlertCircle, Wifi, WifiOff,
} from "lucide-react";

type Role = "MEDICO" | "CLINICA" | "PROPRIETARIO_SALA";
type Filtro = "TODOS" | "HOJE" | "SEMANA" | "INATIVOS" | "VERIFICADOS" | "SUSPENSOS" | "NUNCA";

type Pessoa = {
  userId: string;
  role: Role;
  nome: string;
  email: string;
  foto: string | null;
  lastLoginAt: string | null;
  criadoEm: string;
  isActive: boolean;
  localizacao: string;
  estadoVerificacao: string;
  rating: number;
  totalAvaliacoes: number;
  // profissional
  profissionalId?: string;
  tipo?: string;
  especialidade?: string;
  totalPlantoes?: number;
  totalCandidaturas?: number;
  saldoCarteira?: number;
  disponivelAgora?: boolean;
  // clinica
  clinicaId?: string;
  totalPlantoesPublicados?: number;
  // consultório
  consultorioId?: string;
  totalSalas?: number;
};

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

function tempoAtras(iso: string | null): { texto: string; nivel: "agora" | "hoje" | "semana" | "inativo" | "nunca" } {
  if (!iso) return { texto: "Nunca entrou", nivel: "nunca" };

  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  const h   = Math.floor(diff / 3600000);
  const d   = Math.floor(diff / 86400000);

  if (min < 5)   return { texto: "Agora mesmo",        nivel: "agora"   };
  if (min < 60)  return { texto: `Há ${min} min`,       nivel: "agora"   };
  if (h < 24)    return { texto: `Há ${h}h`,            nivel: "hoje"    };
  if (d === 1)   return { texto: "Ontem",               nivel: "hoje"    };
  if (d <= 7)    return { texto: `Há ${d} dias`,        nivel: "semana"  };
  if (d <= 30)   return { texto: `Há ${d} dias`,        nivel: "inativo" };
  return          { texto: `Há ${d} dias`,              nivel: "inativo" };
}

function tempoMembro(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 7)   return "Esta semana";
  if (d < 30)  return `Há ${d} dias`;
  const m = Math.floor(d / 30);
  if (m < 12)  return `Há ${m} ${m === 1 ? "mês" : "meses"}`;
  const y = Math.floor(m / 12);
  return `Há ${y} ${y === 1 ? "ano" : "anos"}`;
}

const nivelCor: Record<string, string> = {
  agora:   "bg-green-400",
  hoje:    "bg-green-400",
  semana:  "bg-yellow-400",
  inativo: "bg-gray-300",
  nunca:   "bg-gray-200",
};

const roleLabel: Record<Role, string> = {
  MEDICO:            "Médico/a",
  CLINICA:           "Clínica",
  PROPRIETARIO_SALA: "Consultório",
};

const roleIcon: Record<Role, React.ReactNode> = {
  MEDICO:            <Stethoscope size={13} strokeWidth={2} />,
  CLINICA:           <Building2   size={13} strokeWidth={2} />,
  PROPRIETARIO_SALA: <DoorOpen    size={13} strokeWidth={2} />,
};

const roleColor: Record<Role, string> = {
  MEDICO:            "bg-blue-50 text-[#0B3C74]",
  CLINICA:           "bg-teal-50 text-[#00796b]",
  PROPRIETARIO_SALA: "bg-purple-50 text-purple-700",
};

function VerifBadge({ estado }: { estado: string }) {
  if (estado === "APROVADO")   return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><BadgeCheck size={10} strokeWidth={2.5}/> Verificado</span>;
  if (estado === "EM_ANALISE") return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full"><Clock size={10} strokeWidth={2.5}/> Em análise</span>;
  if (estado === "REJEITADO")  return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full"><XCircle size={10} strokeWidth={2.5}/> Rejeitado</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"><AlertCircle size={10} strokeWidth={2.5}/> Pendente</span>;
}

const FILTROS: { key: Filtro; label: string }[] = [
  { key: "TODOS",       label: "Todos"           },
  { key: "HOJE",        label: "Activos hoje"     },
  { key: "SEMANA",      label: "Esta semana"      },
  { key: "INATIVOS",    label: "Inactivos +30d"   },
  { key: "NUNCA",       label: "Nunca entraram"   },
  { key: "VERIFICADOS", label: "Verificados"      },
  { key: "SUSPENSOS",   label: "Suspensos"        },
];

export default function AdminPessoas() {
  const [lista, setLista]       = useState<Pessoa[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filtro, setFiltro]     = useState<Filtro>("TODOS");
  const [pesquisa, setPesquisa] = useState("");
  const [roleF, setRoleF]       = useState<Role | "TODOS">("TODOS");

  useEffect(() => {
    fetch("/api/admin/pessoas", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then(setLista)
      .finally(() => setLoading(false));
  }, []);

  const filtrada = useMemo(() => {
    const agora = Date.now();
    return lista.filter((p) => {
      // pesquisa
      if (pesquisa && !p.nome.toLowerCase().includes(pesquisa.toLowerCase()) &&
          !p.email.toLowerCase().includes(pesquisa.toLowerCase())) return false;

      // role
      if (roleF !== "TODOS" && p.role !== roleF) return false;

      // filtro de actividade
      const diff = p.lastLoginAt ? agora - new Date(p.lastLoginAt).getTime() : null;
      if (filtro === "HOJE")        return diff !== null && diff < 86400000;
      if (filtro === "SEMANA")      return diff !== null && diff < 7 * 86400000;
      if (filtro === "INATIVOS")    return diff === null || diff > 30 * 86400000;
      if (filtro === "NUNCA")       return p.lastLoginAt === null;
      if (filtro === "VERIFICADOS") return p.estadoVerificacao === "APROVADO";
      if (filtro === "SUSPENSOS")   return !p.isActive;
      return true;
    });
  }, [lista, filtro, pesquisa, roleF]);

  // Contagens para os filtros
  const counts = useMemo(() => {
    const agora = Date.now();
    return {
      TODOS:       lista.length,
      HOJE:        lista.filter(p => p.lastLoginAt && agora - new Date(p.lastLoginAt).getTime() < 86400000).length,
      SEMANA:      lista.filter(p => p.lastLoginAt && agora - new Date(p.lastLoginAt).getTime() < 7 * 86400000).length,
      INATIVOS:    lista.filter(p => !p.lastLoginAt || agora - new Date(p.lastLoginAt).getTime() > 30 * 86400000).length,
      NUNCA:       lista.filter(p => !p.lastLoginAt).length,
      VERIFICADOS: lista.filter(p => p.estadoVerificacao === "APROVADO").length,
      SUSPENSOS:   lista.filter(p => !p.isActive).length,
    };
  }, [lista]);

  function profileLink(p: Pessoa) {
    if (p.role === "MEDICO" && p.profissionalId) return `/admin/medicos`;
    if (p.role === "CLINICA") return `/admin/clinicas`;
    return `/admin/consultorios`;
  }

  function initials(nome: string) {
    return nome.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">

      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pessoas</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {lista.length} utilizadores registados · {counts.HOJE} activos hoje
        </p>
      </div>

      {/* Filtros de actividade */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filtro === f.key
                ? "bg-[#0B3C74] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.label} <span className="opacity-60">({counts[f.key]})</span>
          </button>
        ))}
      </div>

      {/* Filtros de role + pesquisa */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar nome ou e-mail..."
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B3C74]"
          />
        </div>
        <select
          value={roleF}
          onChange={e => setRoleF(e.target.value as Role | "TODOS")}
          className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#0B3C74]"
        >
          <option value="TODOS">Todos os tipos</option>
          <option value="MEDICO">Médicos</option>
          <option value="CLINICA">Clínicas</option>
          <option value="PROPRIETARIO_SALA">Consultórios</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Lista */}
      {!loading && (
        <div className="space-y-3">
          {filtrada.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
              Nenhum utilizador encontrado com estes filtros.
            </div>
          )}

          {filtrada.map(p => {
            const { texto: visto, nivel } = tempoAtras(p.lastLoginAt);
            const membro = tempoMembro(p.criadoEm);

            return (
              <div
                key={p.userId}
                className={`bg-white rounded-2xl border p-4 transition-colors ${!p.isActive ? "border-red-100 bg-red-50/30" : "border-gray-100"}`}
              >
                <div className="flex items-start gap-3">

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                      {p.foto
                        ? <img src={p.foto} alt={p.nome} className="w-full h-full object-cover" />
                        : <span className="text-sm font-bold text-gray-400">{initials(p.nome)}</span>
                      }
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${nivelCor[nivel]}`} />
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 text-sm truncate">{p.nome}</p>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleColor[p.role]}`}>
                            {roleIcon[p.role]} {roleLabel[p.role]}
                          </span>
                          {!p.isActive && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                              <WifiOff size={10} strokeWidth={2.5}/> Suspenso
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{p.email}</p>
                        {(p.especialidade || p.localizacao) && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {p.especialidade ? `${p.especialidade}` : ""}
                            {p.especialidade && p.localizacao ? " · " : ""}
                            {p.localizacao}
                          </p>
                        )}
                      </div>
                      <VerifBadge estado={p.estadoVerificacao} />
                    </div>

                    {/* Linha de tempo */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        {nivel === "agora" || nivel === "hoje"
                          ? <Wifi size={11} strokeWidth={2} className="text-green-500" />
                          : <Clock size={11} strokeWidth={1.75} />
                        }
                        {visto}
                      </span>
                      <span>·</span>
                      <span>Membro {membro}</span>
                    </div>

                    {/* Métricas */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-gray-50">
                      {p.role === "MEDICO" && (
                        <>
                          <Metrica label="Candidaturas" valor={p.totalCandidaturas ?? 0} />
                          <Metrica label="Plantões"     valor={p.totalPlantoes ?? 0} />
                          {p.totalAvaliacoes > 0 && <Metrica label="Rating" valor={`★ ${p.rating.toFixed(1)}`} />}
                          {(p.saldoCarteira ?? 0) > 0 && <Metrica label="Carteira" valor={formatAOA(p.saldoCarteira!)} />}
                          {p.disponivelAgora && (
                            <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                              Disponível agora
                            </span>
                          )}
                        </>
                      )}
                      {p.role === "CLINICA" && (
                        <>
                          <Metrica label="Plantões publicados" valor={p.totalPlantoesPublicados ?? 0} />
                          {p.totalAvaliacoes > 0 && <Metrica label="Rating" valor={`★ ${p.rating.toFixed(1)}`} />}
                        </>
                      )}
                      {p.role === "PROPRIETARIO_SALA" && (
                        <Metrica label="Salas" valor={p.totalSalas ?? 0} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Acção */}
                <div className="mt-3 pt-3 border-t border-gray-50 flex justify-end">
                  <Link
                    href={profileLink(p)}
                    className="text-xs font-semibold text-[#0B3C74] hover:underline"
                  >
                    Ver no painel →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metrica({ label, valor }: { label: string; valor: string | number }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-800">{valor}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}
