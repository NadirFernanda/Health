import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/nav";
import { TrendingUp } from "lucide-react";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

export default async function ConsultorioFaturacaoPage() {
  const session = await getAuthSession();
  if (!session || session.role !== "PROPRIETARIO_SALA") redirect("/login");

  const consultorio = await prisma.consultorio.findUnique({
    where: { userId: session.id },
    include: { salas: { select: { id: true } } },
  });
  if (!consultorio) redirect("/login");

  const salaIds = consultorio.salas.map((s) => s.id);

  const reservas = await prisma.reservaSala.findMany({
    where: { salaId: { in: salaIds }, estado: "CONFIRMADA" },
    include: { sala: true, profissional: { select: { nome: true } } },
    orderBy: { criadoEm: "desc" },
  });

  const totalBruto = reservas.reduce((s, r) => s + r.valorTotal, 0);
  const comissao = Math.round(totalBruto * 0.15);
  const totalLiquido = totalBruto - comissao;

  return (
    <div>
      <TopBar titulo="Faturação" back="/consultorio" />

      <div className="px-4 py-5 space-y-5">
        {/* Resumo */}
        <div className="bg-gradient-to-br from-[#00A99D] to-[#0B3C74] rounded-2xl p-5 text-white">
          <p className="text-teal-100 text-sm">Total recebido (líquido)</p>
          <p className="text-3xl font-bold mt-1">{formatAOA(totalLiquido)}</p>
          <div className="mt-3 flex gap-4 text-xs text-teal-200">
            <span>Bruto: {formatAOA(totalBruto)}</span>
            <span>Comissão (15%): {formatAOA(comissao)}</span>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-[#0B3C74]">{reservas.length}</p>
            <p className="text-xs text-gray-500 mt-1">Reservas confirmadas</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-[#00A99D]">{consultorio.salas.length}</p>
            <p className="text-xs text-gray-500 mt-1">Salas ativas</p>
          </div>
        </div>

        {/* Histórico */}
        <section>
          <h2 className="font-bold text-gray-900 text-sm mb-3">Histórico de reservas</h2>
          {reservas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <TrendingUp size={36} strokeWidth={1} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Ainda sem reservas confirmadas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservas.map((r) => {
                const inicio = new Date(r.data);
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{r.profissional.nome}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{r.sala.nome} · {r.duracaoHoras}h</p>
                        <p className="text-gray-400 text-xs">
                          {inicio.toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <p className="font-bold text-[#00A99D] text-sm">+{formatAOA(r.valorTotal - Math.round(r.valorTotal * 0.15))}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
