import { salasMock, reservasDaClinicaMock, clinicaLogada, formatAOA } from "@/lib/mock-data";
import { TopBar } from "@/components/nav";
import Link from "next/link";
import { Building2, Star, DoorOpen, CheckCircle, XCircle } from "lucide-react";

export default function SalasDaClinica() {
  // Filtrar salas desta clínica
  const minhasSalas = salasMock.filter((s) => s.clinica.id === clinicaLogada.id);

  return (
    <div>
      <TopBar
        titulo="Minhas Salas"
        back="/clinica"
        actions={
          <Link
            href="/clinica/salas/nova"
            className="bg-brand-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl"
          >
            + Nova Sala
          </Link>
        }
      />

      {/* Banner Space-as-a-Service */}
      <div className="mx-4 mt-4 bg-gradient-to-r from-[#0B3C74] to-[#00A99D] rounded-2xl p-4 text-white">
        <p className="font-bold text-sm inline-flex items-center gap-1">Space-as-a-Service <Building2 size={14} strokeWidth={2} /></p>
        <p className="text-blue-200 text-xs mt-1">Alugue os seus consultórios por hora e gere receita adicional sem esforço.</p>
      </div>

      {/* Estatísticas rápidas */}
      <div className="mx-4 mt-4 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
          <p className="text-2xl font-bold text-brand-600">{minhasSalas.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Salas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
          <p className="text-2xl font-bold text-success-500">{reservasDaClinicaMock.filter((r) => r.estado === "CONFIRMADA").length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Reservas ativas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
          <p className="text-xl font-bold text-warning-500">
            {formatAOA(reservasDaClinicaMock.reduce((acc, r) => acc + r.valorTotal - r.comissaoPlataforma, 0))}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Receita</p>
        </div>
      </div>

      {/* Lista de salas */}
      <div className="px-4 mt-4 space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{minhasSalas.length} sala(s) registada(s)</p>
        {minhasSalas.map((sala) => {
          const reservasDaSala = reservasDaClinicaMock.filter((r) => r.sala.id === sala.id && r.estado === "CONFIRMADA");
          return (
            <Link key={sala.id} href={`/clinica/salas/${sala.id}`}>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 active:opacity-90 transition-opacity">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg"><DoorOpen size={18} strokeWidth={1.75} className="text-[#0B3C74]" /></div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{sala.nome}</p>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">{sala.tipo === "CONSULTORIO" ? "Consultório" : sala.tipo === "OBSERVACAO" ? "Observação" : "Procedimentos"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-brand-600 font-bold text-sm">{formatAOA(sala.precoPorHora)}<span className="text-gray-400 font-normal text-xs">/h</span></p>
                    <span className={`text-xs font-bold inline-flex items-center gap-1 ${sala.disponivel ? "text-success-500" : "text-red-500"}`}>
                      {sala.disponivel ? <CheckCircle size={12} strokeWidth={2} /> : <XCircle size={12} strokeWidth={2} />} {sala.disponivel ? "Disponível" : "Indisponível"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                  <p className="text-xs text-gray-500 inline-flex items-center gap-1"><Star size={11} strokeWidth={1.75} fill="currentColor" className="text-yellow-500" /> {sala.avaliacaoMedia} · {sala.totalAvaliacoes} avaliações</p>
                  <p className="text-xs text-brand-600 font-semibold">{reservasDaSala.length} reserva(s) ativa(s)</p>
                </div>
              </div>
            </Link>
          );
        })}

        {minhasSalas.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Building2 size={40} strokeWidth={1.25} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Ainda não tem salas registadas.</p>
            <Link
              href="/clinica/salas/nova"
              className="inline-block mt-4 bg-brand-500 text-white text-sm font-bold px-6 py-3 rounded-2xl"
            >
              Adicionar primeira sala
            </Link>
          </div>
        )}
      </div>

      {/* Reservas recentes */}
      {reservasDaClinicaMock.length > 0 && (
        <div className="px-4 mt-6 pb-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Reservas Recentes</p>
          <div className="space-y-2">
            {reservasDaClinicaMock.map((r) => {
              const dataFmt = new Date(r.dataInicio).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" });
              const horaFmt = new Date(r.dataInicio).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{r.sala.nome}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{dataFmt} às {horaFmt} · {r.duracaoHoras}h</p>
                    <p className="text-xs font-mono text-gray-400">{r.codigoReserva}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-success-500">{formatAOA(r.valorTotal - r.comissaoPlataforma)}</p>
                    <p className="text-xs text-gray-400">após comissão</p>
                    <span className="text-xs bg-brand-50 text-brand-600 font-bold px-2 py-0.5 rounded-full mt-1 inline-block">
                      {r.estado === "CONFIRMADA" ? "Confirmada" : r.estado}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
