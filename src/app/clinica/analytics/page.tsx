import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/nav";
import { TrendingUp, Users, CheckCircle, Clock, XCircle, Star } from "lucide-react";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

const MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default async function AnalyticsClinica() {
  const session = await getAuthSession();
  if (!session || session.role !== "CLINICA") redirect("/login");

  const clinica = await prisma.clinica.findUnique({ where: { userId: session.id } });
  if (!clinica) redirect("/login");

  const agora = new Date();
  const inicio6Meses = new Date(agora.getFullYear(), agora.getMonth() - 5, 1);

  const [plantoes, candidaturas, avaliacoes] = await Promise.all([
    prisma.plantao.findMany({
      where: { clinicaId: clinica.id },
      select: {
        id: true,
        especialidade: true,
        dataInicio: true,
        valorKwanzas: true,
        vagas: true,
        vagasPreenchidas: true,
        estado: true,
        criadoEm: true,
        _count: { select: { candidaturas: true } },
      },
      orderBy: { dataInicio: "desc" },
    }),
    prisma.candidatura.findMany({
      where: { plantao: { clinicaId: clinica.id } },
      select: { estado: true, criadoEm: true },
    }),
    prisma.avaliacao.findMany({
      where: { alvoClinicaId: clinica.id },
      select: { estrelas: true },
    }),
  ]);

  // KPIs globais
  const totalPlantoes = plantoes.length;
  const totalPreenchidos = plantoes.filter((p) => p.vagasPreenchidas > 0).length;
  const fillRate = totalPlantoes > 0 ? Math.round((totalPreenchidos / totalPlantoes) * 100) : 0;
  const totalGasto = plantoes.reduce((s, p) => s + p.valorKwanzas, 0);
  const mediaValor = totalPlantoes > 0 ? Math.round(totalGasto / totalPlantoes) : 0;
  const totalCandidatos = candidaturas.length;
  const aceites = candidaturas.filter((c) => c.estado === "ACEITE").length;
  const recusados = candidaturas.filter((c) => c.estado === "RECUSADO").length;
  const pendentes = candidaturas.filter((c) => c.estado === "PENDENTE").length;
  const taxaAceitacao = totalCandidatos > 0 ? Math.round((aceites / totalCandidatos) * 100) : 0;
  const mediaRating =
    avaliacoes.length > 0
      ? avaliacoes.reduce((s, a) => s + a.estrelas, 0) / avaliacoes.length
      : null;

  // Plantões por mês (últimos 6 meses)
  const plantoesMes: Record<string, number> = {};
  const gastoMes: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    plantoesMes[key] = 0;
    gastoMes[key] = 0;
  }
  for (const p of plantoes) {
    const d = new Date(p.criadoEm);
    if (d < inicio6Meses) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in plantoesMes) {
      plantoesMes[key]++;
      gastoMes[key] += p.valorKwanzas;
    }
  }
  const maxPlantoesMes = Math.max(...Object.values(plantoesMes), 1);

  // Especialidades mais procuradas
  const contEsp: Record<string, number> = {};
  for (const p of plantoes) {
    contEsp[p.especialidade] = (contEsp[p.especialidade] ?? 0) + 1;
  }
  const topEspecialidades = Object.entries(contEsp)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxEsp = topEspecialidades[0]?.[1] ?? 1;

  return (
    <div className="pb-28">
      <TopBar titulo="Relatórios & Analytics" back="/clinica" />

      <div className="px-4 pt-4 space-y-4">

        {/* KPIs principais */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Plantões publicados", value: totalPlantoes, cor: "text-[#0B3C74]" },
            { label: "Taxa de preenchimento", value: `${fillRate}%`, cor: "text-[#00A99D]" },
            { label: "Total investido", value: formatAOA(totalGasto), cor: "text-purple-600", full: true },
          ].map((k) => (
            <div
              key={k.label}
              className={`bg-white rounded-2xl border border-gray-100 p-4 ${k.full ? "col-span-2" : ""}`}
            >
              <p className={`text-2xl font-black ${k.cor}`}>{k.value}</p>
              <p className="text-xs text-gray-400 mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Valor médio + avaliação */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xl font-black text-gray-800">{formatAOA(mediaValor)}</p>
            <p className="text-xs text-gray-400 mt-1">Valor médio por plantão</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            {mediaRating !== null ? (
              <>
                <p className="text-xl font-black text-yellow-500 flex items-center gap-1">
                  <Star size={18} className="fill-yellow-400" strokeWidth={1.5} />
                  {mediaRating.toFixed(1)}
                </p>
                <p className="text-xs text-gray-400 mt-1">{avaliacoes.length} avaliações recebidas</p>
              </>
            ) : (
              <>
                <p className="text-xl font-black text-gray-300">—</p>
                <p className="text-xs text-gray-400 mt-1">Sem avaliações ainda</p>
              </>
            )}
          </div>
        </div>

        {/* Gráfico de plantões por mês */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} strokeWidth={2} className="text-[#0B3C74]" />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Plantões — últimos 6 meses</h3>
          </div>
          <div className="flex items-end justify-between gap-1.5 h-28">
            {Object.entries(plantoesMes).map(([key, count]) => {
              const [ano, mes] = key.split("-");
              const pct = Math.round((count / maxPlantoesMes) * 100);
              return (
                <div key={key} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[10px] font-semibold text-[#0B3C74]">{count > 0 ? count : ""}</span>
                  <div className="w-full flex items-end" style={{ height: "72px" }}>
                    <div
                      className="w-full rounded-t-lg bg-[#0B3C74] transition-all duration-500"
                      style={{ height: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-400">{MESES_PT[parseInt(mes) - 1]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Candidaturas */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users size={15} strokeWidth={2} className="text-[#0B3C74]" />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Candidaturas recebidas</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-2xl font-black text-green-600">{aceites}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Aceites</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-yellow-500">{pendentes}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Pendentes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-red-500">{recusados}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Recusadas</p>
            </div>
          </div>

          {totalCandidatos > 0 && (
            <div>
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>Taxa de aceitação</span>
                <span className="font-semibold text-green-600">{taxaAceitacao}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${taxaAceitacao}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-300 mt-1 text-right">{totalCandidatos} candidaturas no total</p>
            </div>
          )}
        </div>

        {/* Top especialidades */}
        {topEspecialidades.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">Especialidades mais publicadas</h3>
            <div className="space-y-2.5">
              {topEspecialidades.map(([esp, count]) => {
                const pct = Math.round((count / maxEsp) * 100);
                return (
                  <div key={esp}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 font-medium truncate pr-2">{esp}</span>
                      <span className="text-gray-400 shrink-0">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-[#0B3C74] h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Estado atual dos plantões */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4">Estado dos plantões</h3>
          {(() => {
            const abertos   = plantoes.filter((p) => p.estado === "ABERTO").length;
            const fechados  = plantoes.filter((p) => p.estado === "FECHADO").length;
            const concluidos = plantoes.filter((p) => p.estado === "CONCLUIDO").length;
            const cancelados = plantoes.filter((p) => p.estado === "CANCELADO").length;
            const estadosData = [
              { label: "Abertos",   value: abertos,    icon: <Clock size={14} className="text-yellow-500" />,   cls: "text-yellow-500" },
              { label: "Fechados",  value: fechados,   icon: <CheckCircle size={14} className="text-blue-500" />, cls: "text-blue-500" },
              { label: "Concluídos", value: concluidos, icon: <CheckCircle size={14} className="text-green-500" />, cls: "text-green-500" },
              { label: "Cancelados", value: cancelados, icon: <XCircle size={14} className="text-red-400" />,   cls: "text-red-400" },
            ];
            return (
              <div className="grid grid-cols-2 gap-3">
                {estadosData.map((e) => (
                  <div key={e.label} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                    {e.icon}
                    <div>
                      <p className={`font-bold text-sm ${e.cls}`}>{e.value}</p>
                      <p className="text-[10px] text-gray-400">{e.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
