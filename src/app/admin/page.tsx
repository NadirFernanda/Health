import {
  adminStats,
  adminMedicosMock,
  adminClinicasMock,
  plantoesMock,
  allTransacoesMock,
  formatAOA,
} from "@/lib/mock-data";
import Link from "next/link";
import {
  Stethoscope, Building2, ClipboardList, Wallet,
  Clock, ChevronRight, ArrowUp, TrendingUp, type LucideIcon,
} from "lucide-react";

function KpiCard({
  icon: Icon, title, value, sub, color,
}: {
  icon: LucideIcon; title: string; value: string | number; sub: string; color: "blue" | "green" | "orange" | "purple";
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
  const pendenteMedicos  = adminMedicosMock.filter((m) => m.estadoVerificacao === "PENDENTE");
  const pendenteClinicas = adminClinicasMock.filter((c) => c.estadoVerificacao === "PENDENTE");

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
        <KpiCard icon={Stethoscope} title="Profissionais"   value={adminStats.totalMedicos}  sub={`${adminStats.medicosVerificados} verificados · ${adminStats.medicosPendentes} pendentes`}   color="blue"   />
        <KpiCard icon={Building2}   title="Clínicas"  value={adminStats.totalClinicas}  sub={`${adminStats.clinicasVerificadas} verificadas · ${adminStats.clinicasPendentes} pendentes`}  color="green"  />
        <KpiCard icon={ClipboardList}   title="Plantões"  value={adminStats.totalPlantoes}  sub={`${adminStats.plantoesAbertos} activos · ${adminStats.plantoesConcluidos} concluídos`}        color="orange" />
        <KpiCard icon={Wallet}   title="Comissões" value={formatAOA(adminStats.comissaoPlataforma)} sub={`Receita total: ${formatAOA(adminStats.receitaPlataforma)}`}                   color="purple" />
      </div>

      {/* Alertas pendentes */}
      {(pendenteMedicos.length > 0 || pendenteClinicas.length > 0) && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Requer Atenção</p>
          {pendenteMedicos.length > 0 && (
            <Link
              href="/admin/verificacao"
              className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-3 group"
            >
              <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
                <Clock size={17} strokeWidth={1.75} className="text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800">{pendenteMedicos.length} médico(s) aguardam verificação</p>
                <p className="text-xs text-yellow-600">Credenciais submetidas, análise em falta</p>
              </div>
              <ChevronRight size={16} strokeWidth={2} className="text-yellow-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
          {pendenteClinicas.length > 0 && (
            <Link
              href="/admin/clinicas"
              className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-3 group"
            >
              <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
                <Clock size={17} strokeWidth={1.75} className="text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800">{pendenteClinicas.length} clínica(s) aguardam verificação</p>
                <p className="text-xs text-yellow-600">Documentos submetidos, análise em falta</p>
              </div>
              <ChevronRight size={16} strokeWidth={2} className="text-yellow-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      )}

      {/* Visão geral rápida */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Plantões hoje",      value: "2", color: "text-[#0B3C74]" },
          { label: "Receita do mês",     value: formatAOA(55000), color: "text-[#00A99D]" },
          { label: "Comissão do mês",    value: formatAOA(5500),  color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-4">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Plantões recentes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Plantões Recentes</p>
          <Link href="/admin/plantoes" className="text-xs text-[#0B3C74] font-semibold flex items-center gap-0.5">Ver todos <ChevronRight size={12} strokeWidth={2} /></Link>
        </div>
        <div className="space-y-1.5">
          {plantoesMock.slice(0, 3).map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <ClipboardList size={15} strokeWidth={1.75} className="text-[#0B3C74]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{p.especialidade} — {p.clinica.nome}</p>
                <p className="text-xs text-gray-400">
                  {new Date(p.dataInicio).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })} · {p.candidatos ?? 0} candidato(s)
                </p>
              </div>
              <p className="text-xs font-bold text-[#0B3C74] shrink-0">{formatAOA(p.valorKwanzas)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transações recentes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Transações Recentes</p>
          <Link href="/admin/transacoes" className="text-xs text-[#0B3C74] font-semibold flex items-center gap-0.5">Ver todas <ChevronRight size={12} strokeWidth={2} /></Link>
        </div>
        <div className="space-y-1.5">
          {allTransacoesMock.slice(0, 4).map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.tipo === "CREDITO" ? "bg-green-50" : "bg-gray-100"}`}>
                {t.tipo === "CREDITO" ? <TrendingUp size={15} strokeWidth={1.75} className="text-green-600" /> : <ArrowUp size={15} strokeWidth={1.75} className="text-gray-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{t.descricao}</p>
                <p className="text-xs text-gray-400">
                  {new Date(t.data).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}
                </p>
              </div>
              <p className={`text-xs font-bold shrink-0 ${t.tipo === "CREDITO" ? "text-[#00A99D]" : "text-gray-600"}`}>
                {t.tipo === "CREDITO" ? "+" : "-"}{formatAOA(Number(t.valorCentavos / 100n))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
