"use client";
import { salasMock, formatAOA, TipoSala } from "@/lib/mock-data";
import { TopBar } from "@/components/nav";
import { useRouter } from "next/navigation";
import { useState, use } from "react";
import { notFound } from "next/navigation";
import { CheckCircle, XCircle, Building2, MapPin, Clock, Star, Landmark, Smartphone, BadgeCheck, Check, AlertTriangle, ChevronRight } from "lucide-react";

const tipoLabel: Record<TipoSala, string> = {
  CONSULTORIO: "Consultório",
  OBSERVACAO: "Observação",
  PROCEDIMENTOS: "Procedimentos",
};

const SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const OCUPADOS = ["09:00", "10:00"]; // mock — slots already booked

type Step = "detalhe" | "horario" | "pagamento" | "confirmado";

export default function DetalheSala({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const sala = salasMock.find((s) => s.id === id);
  const router = useRouter();

  const [step, setStep] = useState<Step>("detalhe");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [duracao, setDuracao] = useState(2);
  const [metodo, setMetodo] = useState<"MULTICAIXA_EXPRESS" | "TRANSFERENCIA_BANCARIA">("MULTICAIXA_EXPRESS");
  const [codigoReserva] = useState(`MF-2026-${String(Math.floor(1000 + Math.random() * 9000))}`);

  if (!sala) return notFound();

  const valorTotal = sala.precoPorHora * duracao;
  const comissao = Math.round(valorTotal * 0.15);

  const equipList = [
    { label: "Maca", ok: sala.equipamentos.maca },
    { label: "Estetoscópio", ok: sala.equipamentos.estetoscopio },
    { label: "Tensiômetro", ok: sala.equipamentos.tensiometro },
    { label: "Termómetro", ok: sala.equipamentos.termometro },
    { label: "Computador", ok: sala.equipamentos.computador },
    { label: "Materiais básicos", ok: sala.equipamentos.materiaisBasicos },
    { label: "Nebulizador", ok: sala.equipamentos.nebulizador },
    { label: "Oxímetro", ok: sala.equipamentos.oximetro },
    { label: "Glucómetro", ok: sala.equipamentos.glucometro },
    { label: "Desfibrilador", ok: sala.equipamentos.desfibrilador },
  ].filter((e) => e.ok || ["Maca", "Estetoscópio", "Tensiômetro", "Termómetro", "Computador"].includes(e.label));

  if (step === "confirmado") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={40} strokeWidth={1.5} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Reserva Confirmada!</h2>
        <p className="text-gray-500 mt-2 text-sm leading-6">
          A clínica foi notificada. Apresente o código no balcão.
        </p>
        {/* QR Code simulado */}
        <div className="mt-6 bg-white border-2 border-gray-200 rounded-2xl p-6 w-48">
          <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center mb-3">
            <div className="grid grid-cols-5 gap-0.5">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-sm ${Math.random() > 0.4 ? "bg-gray-800" : "bg-white"}`} />
              ))}
            </div>
          </div>
          <p className="text-xs font-mono font-bold text-gray-700 text-center">{codigoReserva}</p>
          <p className="text-xs text-gray-400 mt-1 text-center">Código de acesso</p>
        </div>
        <div className="mt-6 bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-600 text-left w-full max-w-xs">
          <p className="flex items-center gap-2"><Building2 size={14} strokeWidth={1.75} className="text-gray-400" /> {sala.clinica.nome}</p>
          <p className="flex items-center gap-2"><MapPin size={14} strokeWidth={1.75} className="text-gray-400" /> {sala.zona}</p>
          <p className="flex items-center gap-2"><Clock size={14} strokeWidth={1.75} className="text-gray-400" /> {data} às {horaInicio}</p>
          <p className="flex items-center gap-2"><Clock size={14} strokeWidth={1.75} className="text-gray-400" /> {duracao}h · <span className="font-bold text-brand-600">{formatAOA(valorTotal)}</span></p>
        </div>
        <button
          onClick={() => router.push("/medico/minhas-reservas")}
          className="mt-6 bg-brand-500 text-white font-bold px-8 py-3 rounded-2xl w-full max-w-xs"
        >
          Ver minhas reservas
        </button>
        <button onClick={() => router.push("/medico")} className="mt-2 text-gray-400 text-sm py-2">
          Voltar ao início
        </button>
      </div>
    );
  }

  if (step === "pagamento") {
    return (
      <div>
        <TopBar titulo="Pagamento" back="#" />
        <div className="px-4 py-5 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2 text-sm text-gray-700">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Resumo da Reserva</p>
            <p className="flex items-center gap-2"><Building2 size={14} strokeWidth={1.75} className="text-gray-400" /> {sala.clinica.nome} — {sala.nome}</p>
            <p className="flex items-center gap-2"><MapPin size={14} strokeWidth={1.75} className="text-gray-400" /> {sala.zona}</p>
            <p className="flex items-center gap-2"><Clock size={14} strokeWidth={1.75} className="text-gray-400" /> {data} às {horaInicio}</p>
            <p className="flex items-center gap-2"><Clock size={14} strokeWidth={1.75} className="text-gray-400" /> {duracao} hora(s)</p>
            <div className="pt-2 border-t border-gray-100 flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-brand-600">{formatAOA(valorTotal)}</span>
            </div>
            <p className="text-xs text-gray-400">Comissão MedFreela (15%): {formatAOA(comissao)} já incluída</p>
          </div>

          {/* Método de pagamento */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Método de Pagamento</p>
            {([
              { key: "MULTICAIXA_EXPRESS",   label: "Multicaixa Express",    icon: <Smartphone size={20} strokeWidth={1.75} />,  desc: "Pagamento imediato via app ou USSD" },
              { key: "TRANSFERENCIA_BANCARIA", label: "Transferência Bancária", icon: <Landmark size={20} strokeWidth={1.75} />, desc: "NIB: 0040-0000-12345-67890 10 1 · BAI" },
            ] as const).map((m) => (
              <button
                key={m.key}
                onClick={() => setMetodo(m.key)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
                  metodo === m.key ? "border-brand-500 bg-brand-50" : "border-gray-100 bg-gray-50"
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                </div>
                {metodo === m.key && <Check size={16} strokeWidth={2.5} className="ml-auto text-brand-500" />}
              </button>
            ))}
          </div>

          {metodo === "MULTICAIXA_EXPRESS" && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="flex items-center gap-1 text-sm font-semibold text-brand-700"><Smartphone size={14} strokeWidth={2} /> Referência Multicaixa</p>
              <p className="text-xs text-brand-600 mt-1">Entidade: <strong>30299</strong> · Referência: <strong>987 654 321</strong></p>
              <p className="text-xs text-blue-500 mt-1">Valor: {formatAOA(valorTotal)} · Válida 30 minutos</p>
            </div>
          )}

          <button
            onClick={() => setStep("confirmado")}
            className="w-full bg-success-500 hover:bg-success-700 text-white font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} strokeWidth={2} /> CONFIRMAR PAGAMENTO
          </button>
          <button onClick={() => setStep("horario")} className="w-full text-gray-400 text-sm py-2 flex items-center justify-center gap-1">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (step === "horario") {
    return (
      <div>
        <TopBar titulo="Escolher Horário" back="#" />
        <div className="px-4 py-5 space-y-5">
          {/* Data */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Horário de início */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Hora de Início</p>
            <div className="flex flex-wrap gap-2">
              {SLOTS.map((slot) => {
                const ocupado = OCUPADOS.includes(slot);
                return (
                  <button
                    key={slot}
                    disabled={ocupado}
                    onClick={() => setHoraInicio(slot)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors border ${
                      ocupado
                        ? "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed line-through"
                        : horaInicio === slot
                        ? "bg-brand-500 text-white border-brand-500"
                        : "bg-white text-gray-700 border-gray-200 hover:border-brand-300"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">Slots riscados estão reservados</p>
          </div>

          {/* Duração */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Duração: <span className="text-brand-600">{duracao}h</span></p>
            <input
              type="range" min={1} max={8} value={duracao}
              onChange={(e) => setDuracao(Number(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1h</span><span>4h</span><span>8h</span>
            </div>
          </div>

          {/* Resumo valor */}
          <div className="bg-brand-50 rounded-2xl border border-brand-100 px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-xs text-brand-600">Total estimado</p>
              <p className="text-xl font-bold text-brand-700">{formatAOA(valorTotal)}</p>
            </div>
            <div className="text-right text-xs text-brand-500">
              <p>{formatAOA(sala.precoPorHora)}/h × {duracao}h</p>
            </div>
          </div>

          <button
            disabled={!data || !horaInicio}
            onClick={() => setStep("pagamento")}
            className="w-full bg-brand-500 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-1"
          >
            Continuar para Pagamento <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  // Step: detalhe
  return (
    <div>
      <TopBar titulo={sala.nome} back="/medico/salas" />

      {/* Header */}
      <div className="bg-white px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl font-bold text-[#1A6FBB]">
            {sala.clinica.nome.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-gray-900 text-base">{sala.clinica.nome}</h2>
              {sala.clinica.verified && <BadgeCheck size={15} strokeWidth={2} className="text-success-500" />}
            </div>
            <p className="flex items-center gap-1 text-gray-500 text-sm"><MapPin size={12} strokeWidth={1.75} /> {sala.zona}</p>
            <p className="flex items-center gap-1 text-yellow-500 text-xs mt-0.5"><Star size={11} strokeWidth={1.75} fill="currentColor" /> {sala.avaliacaoMedia} ({sala.totalAvaliacoes} avaliações)</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="bg-blue-50 text-[#1A6FBB] text-xs font-bold px-2.5 py-1 rounded-full">{tipoLabel[sala.tipo]}</span>
          <span className="bg-success-50 text-success-700 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
            <CheckCircle size={12} strokeWidth={2.25} /> Disponível
          </span>
        </div>
      </div>

      {/* Preço */}
      <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
        <p className="text-3xl font-bold text-brand-600">{formatAOA(sala.precoPorHora)}<span className="text-base text-gray-400 font-normal">/hora</span></p>
        <p className="text-xs text-gray-400 mt-1">Comissão MedFreela (15%) incluída no preço</p>
      </div>

      {/* Equipamentos */}
      <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Equipamentos</h3>
        <div className="space-y-2">
          {equipList.map((e) => (
            <div key={e.label} className="flex items-center gap-2.5 text-sm">
              <span className={e.ok ? "text-success-500" : "text-red-400"}>
                {e.ok ? <CheckCircle size={16} strokeWidth={2} /> : <XCircle size={16} strokeWidth={2} />}
              </span>
              <span className={e.ok ? "text-gray-800" : "text-gray-300 line-through"}>{e.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Descrição */}
      <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Sobre a Sala</h3>
        <p className="text-sm text-gray-700 leading-6">{sala.descricao}</p>
      </div>

      {/* Política de cancelamento */}
      <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Política de Cancelamento</h3>
        <div className="space-y-1.5 text-xs text-gray-600">
          <p className="flex items-center gap-1"><Check size={13} strokeWidth={2} className="text-gray-500" /> Cancelamento com &gt; 24h: reembolso 100%</p>
          <p className="flex items-center gap-1"><AlertTriangle size={13} strokeWidth={2} className="text-yellow-500" /> Cancelamento com &lt; 24h: sem reembolso</p>
          <p className="flex items-center gap-1"><Check size={13} strokeWidth={2} className="text-gray-500" /> A clínica pode cancelar mediante aviso de 4h</p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 py-6">
        <button
          onClick={() => setStep("horario")}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-2xl text-base transition-colors"
        >
          RESERVAR ESTA SALA
        </button>
      </div>
    </div>
  );
}
