import { salasMock, reservasDaClinicaMock, formatAOA, TipoSala } from "@/lib/mock-data";
import { TopBar } from "@/components/nav";
import { notFound } from "next/navigation";
import Link from "next/link";

const tipoLabel: Record<TipoSala, string> = {
  CONSULTORIO: "Consultório",
  OBSERVACAO: "Observação",
  PROCEDIMENTOS: "Procedimentos",
};

export default async function DetalheSalaClinica({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sala = salasMock.find((s) => s.id === id);
  if (!sala) return notFound();

  const reservas = reservasDaClinicaMock.filter((r) => r.sala.id === id);
  const receitaTotal = reservas.reduce((acc, r) => acc + r.valorTotal - r.comissaoPlataforma, 0);

  return (
    <div>
      <TopBar titulo={sala.nome} back="/clinica/salas" />

      {/* Header */}
      <div className="bg-white px-4 py-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{sala.nome}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{tipoLabel[sala.tipo]} · 📍 {sala.zona}</p>
            <p className="text-yellow-500 text-xs mt-1">⭐ {sala.avaliacaoMedia} ({sala.totalAvaliacoes} avaliações)</p>
          </div>
          <div className="text-right">
            <p className="text-brand-600 font-bold text-xl">{formatAOA(sala.precoPorHora)}<span className="text-xs text-gray-400 font-normal">/h</span></p>
            <span className={`text-xs font-bold mt-1 inline-block ${sala.disponivel ? "text-success-500" : "text-red-500"}`}>
              {sala.disponivel ? "● Disponível" : "○ Indisponível"}
            </span>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
          <p className="text-2xl font-bold text-brand-600">{reservas.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Reservas registadas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
          <p className="text-lg font-bold text-success-500">{formatAOA(receitaTotal)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Receita líquida</p>
        </div>
      </div>

      {/* Equipamentos */}
      <div className="mx-4 mt-4 bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Equipamentos</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(sala.equipamentos) as [string, boolean][]).map(([key, val]) => {
            const labels: Record<string, string> = {
              maca: "Maca", estetoscopio: "Estetoscópio", tensiometro: "Tensiômetro",
              termometro: "Termómetro", computador: "Computador", materiaisBasicos: "Materiais básicos",
              nebulizador: "Nebulizador", oximetro: "Oxímetro", glucometro: "Glucómetro", desfibrilador: "Desfibrilador",
            };
            return (
              <div key={key} className={`flex items-center gap-2 text-xs ${val ? "text-gray-700" : "text-gray-300"}`}>
                <span>{val ? "✅" : "❌"}</span>
                <span>{labels[key] ?? key}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Descrição */}
      <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Descrição</p>
        <p className="text-sm text-gray-700 leading-6">{sala.descricao}</p>
      </div>

      {/* Reservas */}
      <div className="px-4 mt-4 pb-8">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Reservas</p>
        {reservas.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm">Nenhuma reserva ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reservas.map((r) => {
              const dataFmt = new Date(r.dataInicio).toLocaleDateString("pt-AO", { weekday: "short", day: "2-digit", month: "short" });
              const horaFmt = new Date(r.dataInicio).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{dataFmt} às {horaFmt}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.duracaoHoras}h · <span className="font-mono">{r.codigoReserva}</span></p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      r.estado === "CONFIRMADA" ? "bg-brand-50 text-brand-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {r.estado === "CONFIRMADA" ? "Confirmada" : r.estado}
                    </span>
                    <p className="text-xs text-success-500 font-bold mt-1">{formatAOA(r.valorTotal - r.comissaoPlataforma)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
