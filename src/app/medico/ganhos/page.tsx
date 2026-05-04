import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/nav";
import { redirect } from "next/navigation";
import { TrendingUp, ArrowUp } from "lucide-react";

function formatAOA(valorKwanzas: number) {
  return new Intl.NumberFormat("pt-PT").format(valorKwanzas) + " AOA";
}

export default async function GanhosMedico() {
  const session = await getAuthSession();
  if (!session || session.role !== "MEDICO") redirect("/login");

  const prof = await prisma.profissional.findUnique({ where: { userId: session.id } });
  if (!prof) redirect("/login");

  const transacoes = await prisma.transacaoCarteira.findMany({
    where: { profissionalId: prof.id },
    orderBy: { criadoEm: "desc" },
  });

  // Converter BigInt → number (AOA) para evitar erros de serialização RSC
  const saldoAOA = Number(prof.saldoCarteiraCentavos ?? 0n) / 100;
  const saldoKwanzas = prof.saldoCarteira ?? 0;

  type TransacaoSafe = {
    id: string;
    tipo: string;
    descricao: string;
    estado: string;
    data: string;
    valorAOA: number;
  };

  const transacoesSafe: TransacaoSafe[] = transacoes.map((t) => ({
    id: t.id,
    tipo: t.tipo,
    descricao: t.descricao,
    estado: t.estado,
    data: t.criadoEm.toISOString(),
    valorAOA: Number(t.valorCentavos ?? 0n) / 100,
  }));

  const pendente = transacoesSafe
    .filter((t) => t.tipo === "CREDITO" && t.estado === "PENDENTE")
    .reduce((sum, t) => sum + t.valorAOA, 0);

  return (
    <div>
      <TopBar titulo="Meus Ganhos" back="/medico" />

      {/* Saldo */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] px-5 py-6 mx-4 mt-4 rounded-2xl">
        <p className="text-blue-200 text-sm">Saldo disponível</p>
        <p className="text-white text-4xl font-bold mt-1">
          {formatAOA(saldoAOA > 0 ? saldoAOA : saldoKwanzas)}
        </p>
        {pendente > 0 && (
          <p className="text-blue-200 text-xs mt-2">
            ⏳ {formatAOA(pendente)} em processamento (libertação em 24h)
          </p>
        )}
        <button className="mt-4 bg-white text-[#0B3C74] font-bold text-sm px-5 py-2.5 rounded-xl w-full">
          LEVANTAR SALDO
        </button>
      </div>

      {/* Histórico */}
      <div className="px-4 pt-5 pb-28">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Histórico</h2>
        {transacoesSafe.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <TrendingUp size={36} className="mx-auto mb-2 text-gray-300" strokeWidth={1.25} />
            <p className="text-sm">Ainda não tens movimentos na carteira.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transacoesSafe.map((t) => (
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
                    {new Date(t.data).toLocaleDateString("pt-PT", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-sm ${t.tipo === "CREDITO" ? "text-[#00A99D]" : "text-gray-600"}`}>
                    {t.tipo === "CREDITO" ? "+" : "−"}{formatAOA(t.valorAOA)}
                  </p>
                  {t.estado === "PENDENTE" && (
                    <span className="text-xs text-yellow-600 font-medium">Pendente</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
