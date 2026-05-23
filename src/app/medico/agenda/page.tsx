"use client";

import { useState, useEffect, useMemo } from "react";
import { TopBar } from "@/components/nav";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Banknote } from "lucide-react";

type EventoPlantao = {
  tipo: "plantao";
  id: string;
  plantaoId: string;
  dataInicio: string;
  dataFim: string;
  especialidade: string;
  entidade: string;
  valorKwanzas: number;
};

type EventoSala = {
  tipo: "sala";
  id: string;
  data: string;
  horaInicio: string;
  duracaoHoras: number;
  salaNome: string;
  clinicaNome: string;
  valorTotal: number;
};

type EventoAgenda = EventoPlantao | EventoSala;

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
}

function isoDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function eventoData(ev: EventoAgenda): Date {
  return new Date(ev.tipo === "plantao" ? ev.dataInicio : ev.data);
}

export default function AgendaMedico() {
  const today = new Date();
  const todayKey = isoDateKey(today);

  const [ano, setAno] = useState(today.getFullYear());
  const [mes, setMes] = useState(today.getMonth());
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(todayKey);
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/medico/candidaturas", { credentials: "include" }).then((r) => r.ok ? r.json() : []),
      fetch("/api/medico/reservas", { credentials: "include" }).then((r) => r.ok ? r.json() : []),
    ]).then(([cands, reservas]) => {
      const evs: EventoAgenda[] = [];

      for (const c of cands) {
        if (c.estado !== "ACEITE") continue;
        evs.push({
          tipo: "plantao",
          id: c.id,
          plantaoId: c.plantao.id,
          dataInicio: c.plantao.dataInicio,
          dataFim: c.plantao.dataFim,
          especialidade: c.plantao.especialidade,
          entidade: c.plantao.clinica?.nome ?? c.plantao.profissionalPublicador?.nome ?? "Plantão",
          valorKwanzas: c.plantao.valorKwanzas,
        });
      }

      for (const r of reservas) {
        if (["CANCELADA", "CANCELADA_PROFISSIONAL", "CANCELADA_CLINICA"].includes(r.estado)) continue;
        evs.push({
          tipo: "sala",
          id: r.id,
          data: r.data,
          horaInicio: r.horaInicio,
          duracaoHoras: r.duracaoHoras,
          salaNome: r.sala.nome,
          clinicaNome: r.sala.clinica?.nome ?? "–",
          valorTotal: r.valorTotal,
        });
      }

      setEventos(evs);
      setLoading(false);
    });
  }, []);

  const eventosPorDia = useMemo(() => {
    const map: Record<string, { plantao: boolean; sala: boolean }> = {};
    for (const ev of eventos) {
      const key = isoDateKey(eventoData(ev));
      if (!map[key]) map[key] = { plantao: false, sala: false };
      if (ev.tipo === "plantao") map[key].plantao = true;
      else map[key].sala = true;
    }
    return map;
  }, [eventos]);

  const eventosDia = useMemo(
    () =>
      diaSelecionado
        ? eventos.filter((ev) => isoDateKey(eventoData(ev)) === diaSelecionado)
        : [],
    [eventos, diaSelecionado]
  );

  const eventosMes = useMemo(
    () =>
      eventos
        .filter((ev) => {
          const d = eventoData(ev);
          return d.getFullYear() === ano && d.getMonth() === mes;
        })
        .sort((a, b) => eventoData(a).getTime() - eventoData(b).getTime()),
    [eventos, ano, mes]
  );

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  function navMes(delta: number) {
    const d = new Date(ano, mes + delta, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth());
    setDiaSelecionado(null);
  }

  const listagem = diaSelecionado ? eventosDia : eventosMes;
  const listVazia = !diaSelecionado
    ? `Nenhum evento em ${MESES[mes]}.`
    : "Nenhum evento neste dia.";

  return (
    <div>
      <TopBar titulo="Agenda" back="/medico" />
      <div className="px-4 py-4 pb-10 space-y-4">

        {/* Calendário */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          {/* Navegação de mês */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navMes(-1)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <span className="font-bold text-gray-900 text-sm">{MESES[mes]} {ano}</span>
            <button
              onClick={() => navMes(1)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Cabeçalho da semana */}
          <div className="grid grid-cols-7 mb-1">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Células do calendário */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: primeiroDia }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: diasNoMes }).map((_, i) => {
              const dia = i + 1;
              const key = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
              const isToday = key === todayKey;
              const isSelected = key === diaSelecionado;
              const ev = eventosPorDia[key];
              return (
                <button
                  key={dia}
                  onClick={() => setDiaSelecionado(key === diaSelecionado ? null : key)}
                  className={`flex flex-col items-center py-1.5 rounded-xl transition-colors ${
                    isSelected ? "bg-[#0B3C74]" : isToday ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <span className={`text-xs font-semibold ${isSelected ? "text-white" : isToday ? "text-[#0B3C74]" : "text-gray-700"}`}>
                    {dia}
                  </span>
                  <div className="flex gap-0.5 mt-0.5 h-1.5">
                    {ev?.plantao && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-blue-300" : "bg-[#0B3C74]"}`} />}
                    {ev?.sala && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-teal-300" : "bg-[#00A99D]"}`} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-[#0B3C74]" /> Plantão
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-[#00A99D]" /> Sala
            </span>
          </div>
        </div>

        {/* Lista de eventos */}
        {loading ? (
          <div className="flex justify-center pt-6">
            <div className="w-7 h-7 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              {diaSelecionado
                ? new Date(diaSelecionado + "T12:00:00").toLocaleDateString("pt-AO", { weekday: "long", day: "2-digit", month: "long" })
                : `${eventosMes.length} evento${eventosMes.length !== 1 ? "s" : ""} em ${MESES[mes]}`}
            </p>

            {listagem.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
                {listVazia}
              </div>
            ) : (
              <div className="space-y-3">
                {listagem.map((ev) => {
                  const d = eventoData(ev);
                  const dateChip = (
                    <div className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center shrink-0 ${ev.tipo === "plantao" ? "bg-blue-50" : "bg-teal-50"}`}>
                      <span className={`text-[9px] font-bold leading-none ${ev.tipo === "plantao" ? "text-[#0B3C74]" : "text-[#00A99D]"}`}>
                        {MESES[d.getMonth()].slice(0, 3).toUpperCase()}
                      </span>
                      <span className={`text-sm font-black leading-none ${ev.tipo === "plantao" ? "text-[#0B3C74]" : "text-[#00A99D]"}`}>
                        {d.getDate()}
                      </span>
                    </div>
                  );

                  if (ev.tipo === "plantao") {
                    return (
                      <Link
                        key={ev.id}
                        href={`/medico/plantoes/${ev.plantaoId}`}
                        className="flex items-start gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:border-[#0B3C74]/30 transition-colors"
                      >
                        {dateChip}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0B3C74] shrink-0" />
                            <span className="text-[10px] font-bold text-[#0B3C74] uppercase tracking-wide">Plantão</span>
                          </div>
                          <p className="font-semibold text-gray-900 text-sm truncate">{ev.entidade}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{ev.especialidade}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock size={10} strokeWidth={1.75} />
                              {formatHora(ev.dataInicio)} – {formatHora(ev.dataFim)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Banknote size={10} strokeWidth={1.75} />
                              {formatAOA(ev.valorKwanzas)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={ev.id}
                      href="/medico/minhas-reservas"
                      className="flex items-start gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:border-[#00A99D]/30 transition-colors"
                    >
                      {dateChip}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00A99D] shrink-0" />
                          <span className="text-[10px] font-bold text-[#00A99D] uppercase tracking-wide">Reserva de Sala</span>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm truncate">{ev.salaNome}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{ev.clinicaNome}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock size={10} strokeWidth={1.75} />
                            {ev.horaInicio} · {ev.duracaoHoras}h
                          </span>
                          <span className="flex items-center gap-1">
                            <Banknote size={10} strokeWidth={1.75} />
                            {formatAOA(ev.valorTotal)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
