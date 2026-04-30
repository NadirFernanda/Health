"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Stethoscope, Building2, ClipboardList, Wallet,
  Clock, ChevronRight, TrendingUp, type LucideIcon,
} from "lucide-react";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(v);
}

type Stats = {
  totalMedicos: number; medicosVerificados: number; medicosPendentes: number;
  totalClinicas: number; clinicasVerificadas: number; clinicasPendentes: number;
  totalPlantoes: number; plantoesAbertos: number; plantoesConcluidos: number;
  comissaoPlataforma: number; receitaPlataforma: number;
};
type Transacao = { id: string; descricao: string; valorBruto: number; data: string; };

function KpiCard({ icon: Icon, title, value, sub, color }: {
  icon: LucideIcon; title: string; value: string | number; sub: string;
  color: "blue" | "green" | "orange" | "purple";
}) {
  const cls = {
    blue:   "bg-blue-50 text-blue-600",
    green:  "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-700",
  }[color];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cls}`}>
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs font-semibold text-gray-700 mt-0.5">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats).catch(() => {});
    fetch("/api/admin/transacoes").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setTransacoes(d.slice(0, 4));
    }).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="p-4 pt-10 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendenteMedicos  = stats.medicosPendentes;
  const pendenteClinicas = stats.clinicasPendentes;

  return (
    <div className="p-4 space-y-5 pb-10 max-w-2xl mx-auto">
      {/* Saudação */}
      <div className="pt-1">
        <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {new Date().toLocaleDateString("pt-AO", {
            weekday: "long", day: "2-digit", month: "long", year: "numeric",
          })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard icon={Stethoscope} title="Profissionais" value={stats.totalMedicos}
          sub={`${stats.medicosVerificados} verificados · ${stats.medicosPendentes} pendentes`} color="blue" />
        <KpiCard icon={Building2} title="Clínicas" value={stats.totalClinicas}
          sub={`${stats.clinicasVerificadas} verificadas · ${stats.clinicasPendentes} pendentes`} color="green" />
        <KpiCard icon={ClipboardList} title="Plantões" value={stats.totalPlantoes}
          sub={`${stats.plantoesAbertos} activos · ${stats.plantoesConcluidos} concluídos`} color="orange" />
        <KpiCard icon={Wallet} title="Comissões" value={formatAOA(stats.comissaoPlataforma)}
          sub={`Receita total: ${formatAOA(stats.receitaPlataforma)}`} color="purple" />
      </div>

      {/* Alertas pendentes */}
      {(pendenteMedicos > 0 || pendenteClinicas > 0) && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Requer Atenção</p>
          {pendenteMedicos > 0 && (
            <Link href="/admin/verificacao"
              className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-3 group">
              <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
                <Clock size={17} strokeWidth={1.75} className="text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800">{pendenteMedicos} médico(s) aguardam verificação</p>
                <p className="text-xs text-yellow-600">Credenciais submetidas, análise em falta</p>
              </div>
              <ChevronRight size={16} strokeWidth={2} className="text-yellow-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
          {pendenteClinicas > 0 && (
            <Link href="/admin/clinicas"
              className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-3 group">
              <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
                <Clock size={17} strokeWidth={1.75} className="text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800">{pendenteClinicas} clínica(s) aguardam verificação</p>
                <p className="text-xs text-yellow-600">Documentos submetidos, análise em falta</p>
              </div>
              <ChevronRight size={16} strokeWidth={2} className="text-yellow-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      )}

      {/* Transações recentes */}
      {transacoes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Transações Recentes</p>
            <Link href="/admin/transacoes" className="text-xs text-[#0B3C74] font-semibold flex items-center gap-0.5">
              Ver todas <ChevronRight size={12} strokeWidth={2} />
            </Link>
          </div>
          <div className="space-y-1.5">
            {transacoes.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-green-50">
                  <TrendingUp size={15} strokeWidth={1.75} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{t.descricao}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(t.data).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <p className="text-xs font-bold shrink-0 text-[#00A99D]">+{formatAOA(t.valorBruto)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links rápidos */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { href: "/admin/medicos",    label: "Profissionais", color: "bg-blue-50 text-[#0B3C74]" },
          { href: "/admin/clinicas",   label: "Clínicas",      color: "bg-green-50 text-green-700" },
          { href: "/admin/plantoes",   label: "Plantões",      color: "bg-orange-50 text-orange-700" },
          { href: "/admin/transacoes", label: "Finanças",      color: "bg-purple-50 text-purple-700" },
        ].map((l) => (
          <Link key={l.href} href={l.href}
            className={`${l.color} rounded-2xl p-3.5 text-sm font-semibold flex items-center justify-between`}>
            {l.label}
            <ChevronRight size={14} strokeWidth={2} />
          </Link>
        ))}
      </div>
    </div>
  );
}
