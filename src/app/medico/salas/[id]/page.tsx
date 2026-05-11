"use client";
import { TopBar } from "@/components/nav";
import { useRouter } from "next/navigation";
import { useState, use, useEffect } from "react";
import {
  Building2, MapPin, Star, BadgeCheck, CheckCircle2,
  ChevronRight, Loader2, AlertTriangle, Check, FileText,
  Scale, ShieldCheck, UserCheck, Clock, Banknote, XCircle,
  ScrollText,
} from "lucide-react";
import {
  MetodoPagamentoSelector,
  TransferenciaBancariaInfo,
  SimulatedPaymentGateway,
  type MetodoPagamento,
} from "@/components/payment-gateway";

function formatAOA(v: number) { return new Intl.NumberFormat("pt-AO").format(v) + " AOA"; }
function formatDataLong(iso: string) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("pt-AO", { day: "2-digit", month: "long", year: "numeric" });
}

type TipoSala = "CONSULTORIO" | "OBSERVACAO" | "PROCEDIMENTOS";

const TIPO_LABEL: Record<TipoSala, string> = {
  CONSULTORIO: "Consultório",
  OBSERVACAO: "Observação",
  PROCEDIMENTOS: "Procedimentos",
};

const SLOTS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

type Proprietario = { id: string; nome: string; cidade: string; morada: string | null; verified: boolean; rating: number };

type Sala = {
  id: string; nome: string; tipo: TipoSala; precoPorHora: number; zona: string;
  descricao: string; disponivel: boolean; avaliacaoMedia: number; totalAvaliacoes: number;
  clinica: Proprietario | null;
  consultorio: Proprietario | null;
  proprietario: Proprietario | null;
  equipamentos: Record<string, boolean>;
};

type PagamentoInfo = {
  pagamentoId: string; valorTotal: number; metodo: MetodoPagamento; codigoQr: string;
};

type Step = "detalhe" | "horario" | "contrato" | "pagamento" | "confirmado";

const EQUIP_LABELS: Record<string, string> = {
  maca: "Maca", estetoscopio: "Estetoscópio", tensiometro: "Tensiómetro",
  termometro: "Termómetro", computador: "Computador", materiaisBasicos: "Mat. Básicos",
  nebulizador: "Nebulizador", oximetro: "Oxímetro", glucometro: "Glucómetro",
  desfibrilador: "Desfibrilador",
};

const STEP_LABEL: Record<Step, string> = {
  detalhe: "Detalhe", horario: "Horário", contrato: "Contrato", pagamento: "Pagamento", confirmado: "Confirmado",
};

export default function DetalheSala({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [sala, setSala] = useState<Sala | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("detalhe");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [duracao, setDuracao] = useState(2);
  const [contratoAceite, setContratoAceite] = useState(false);
  const [metodo, setMetodo] = useState<MetodoPagamento>("MULTICAIXA_EXPRESS");
  const [pagamentoInfo, setPagamentoInfo] = useState<PagamentoInfo | null>(null);
  const [reservaId, setReservaId] = useState<string | null>(null);
  const [reservandoLoading, setReservandoLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`/api/salas/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.id) setSala(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 size={28} className="animate-spin text-[#0B3C74]" />
    </div>
  );
  if (!sala) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-400 gap-2">
      <Building2 size={36} strokeWidth={1.25} />
      <p className="text-sm">Sala não encontrada.</p>
    </div>
  );

  const valorTotal = sala.precoPorHora * duracao;
  const comissao = Math.round(valorTotal * 0.10);
  const equipDisponiveis = Object.entries(sala.equipamentos)
    .filter(([, v]) => v)
    .map(([k]) => EQUIP_LABELS[k] ?? k);

  const horaFim = (() => {
    if (!horaInicio) return "–";
    const [h, m] = horaInicio.split(":").map(Number);
    const fim = new Date(0, 0, 0, h + duracao, m);
    return `${String(fim.getHours()).padStart(2, "0")}:${String(fim.getMinutes()).padStart(2, "0")}`;
  })();

  const handleCriarReserva = async () => {
    setReservandoLoading(true);
    setErro("");
    const res = await fetch("/api/medico/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salaId: id, data, horaInicio, duracaoHoras: duracao, metodo }),
    });
    setReservandoLoading(false);
    if (res.ok) {
      const d = await res.json() as { id: string; pagamentoId: string; valorTotal: number; codigoQr: string };
      setReservaId(d.id);
      setPagamentoInfo({ pagamentoId: d.pagamentoId, valorTotal: d.valorTotal, metodo, codigoQr: d.codigoQr });
    } else {
      const d = await res.json() as { error?: string };
      setErro(d.error ?? "Erro ao criar reserva.");
    }
  };

  const handleAssinarContrato = async () => {
    if (!reservaId) {
      setErro("Erro: Reserva não encontrada.");
      return;
    }
    setReservandoLoading(true);
    setErro("");
    const res = await fetch(`/api/medico/reservas/${reservaId}/contrato`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    setReservandoLoading(false);
    if (res.ok) {
      setStep("pagamento");
    } else {
      const d = await res.json() as { error?: string };
      setErro(d.error ?? "Erro ao assinar contrato.");
    }
  };

  /* ── Progress indicator (steps 2-4) ── */
  const ProgressBar = ({ current }: { current: Step }) => {
    const visible: Step[] = ["horario", "contrato", "pagamento"];
    const idx = visible.indexOf(current);
    if (idx === -1) return null;
    return (
      <div className="flex items-center gap-1.5 px-4 pb-3 pt-1">
        {visible.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1">
            <div className={`h-1 w-full rounded-full transition-colors ${i <= idx ? "bg-[#00A99D]" : "bg-gray-200"}`} />
            <span className={`text-[10px] font-semibold ${i <= idx ? "text-[#0B3C74]" : "text-gray-400"}`}>
              {STEP_LABEL[s]}
            </span>
          </div>
        ))}
      </div>
    );
  };

  /* ── CONFIRMADO ── */
  if (step === "confirmado") {
    return (
      <div className="min-h-screen bg-[#f7f8fa] flex flex-col items-center justify-center px-6 text-center pb-12">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-emerald-100">
          <CheckCircle2 size={44} strokeWidth={1.5} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Reserva Confirmada!</h2>
        <p className="text-gray-500 mt-2 text-sm leading-6 max-w-xs">
          O espaço foi reservado. Apresente o código de acesso no balcão no dia marcado.
        </p>

        {pagamentoInfo?.codigoQr && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-52">
            <div className="w-full aspect-square bg-gray-50 rounded-xl flex items-center justify-center mb-3">
              <div className="grid grid-cols-5 gap-px">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className={`w-5 h-5 rounded-[2px] ${(i * 7 + 3) % 3 !== 0 ? "bg-gray-900" : "bg-white"}`} />
                ))}
              </div>
            </div>
            <p className="text-xs font-mono font-black text-gray-800 text-center tracking-widest">{pagamentoInfo.codigoQr}</p>
            <p className="text-[10px] text-gray-400 mt-1 text-center">Código de acesso</p>
          </div>
        )}

        <div className="mt-5 bg-white border border-gray-100 rounded-2xl px-4 py-4 text-sm text-gray-600 text-left w-full max-w-xs space-y-2.5">
          <p className="flex items-center gap-2">
            <Building2 size={14} strokeWidth={1.75} className="text-gray-400 shrink-0" />
            <span className="font-semibold">{sala.proprietario?.nome ?? "–"} — {sala.nome}</span>
          </p>
          <p className="flex items-center gap-2">
            <MapPin size={14} strokeWidth={1.75} className="text-gray-400 shrink-0" /> {sala.zona}
          </p>
          <p className="flex items-center gap-2">
            <Clock size={14} strokeWidth={1.75} className="text-gray-400 shrink-0" />
            {formatDataLong(data)} · {horaInicio} – {horaFim}
          </p>
          <p className="flex items-center gap-2 font-bold text-[#0B3C74]">
            <Banknote size={14} strokeWidth={1.75} className="text-[#00A99D] shrink-0" />
            {formatAOA(valorTotal)}
          </p>
        </div>

        <button
          onClick={() => router.push("/medico/minhas-reservas")}
          className="mt-6 bg-gradient-to-r from-[#0B3C74] to-[#00A99D] text-white font-bold px-6 py-3.5 rounded-2xl w-full max-w-xs shadow-lg"
        >
          Ver as minhas reservas
        </button>
        <button onClick={() => router.push("/medico")} className="mt-2 text-gray-400 text-sm py-2">
          Voltar ao início
        </button>
      </div>
    );
  }

  /* ── PAGAMENTO ── */
  if (step === "pagamento") {
    if (pagamentoInfo) {
      return (
        <div>
          <TopBar titulo="Pagamento" onBack={() => setPagamentoInfo(null)} />
          <div className="px-4 py-5 space-y-4">
            {pagamentoInfo.metodo === "TRANSFERENCIA_BANCARIA" ? (
              <TransferenciaBancariaInfo
                pagamentoId={pagamentoInfo.pagamentoId}
                valor={pagamentoInfo.valorTotal}
                onVerPlantoes={() => router.push("/medico/minhas-reservas")}
              />
            ) : (
              <>
                <SimulatedPaymentGateway
                  pagamentoId={pagamentoInfo.pagamentoId}
                  metodo={pagamentoInfo.metodo}
                  valor={pagamentoInfo.valorTotal}
                  onSucesso={() => setStep("confirmado")}
                  onErro={() => {}}
                />
                <button
                  onClick={() => router.push("/medico/minhas-reservas")}
                  className="w-full text-center text-sm text-gray-400 py-2"
                >
                  Pagar mais tarde
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="pb-10">
        <TopBar titulo="Pagamento" onBack={() => setStep("contrato")} />
        <ProgressBar current="pagamento" />
        <div className="px-4 space-y-4">
          {/* Resumo */}
          <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] rounded-2xl px-5 py-5 text-white">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Resumo da reserva</p>
            <p className="text-white font-black text-lg mt-1">{sala.proprietario?.nome ?? "–"} — {sala.nome}</p>
            <p className="text-blue-200 text-xs mt-0.5 flex items-center gap-1">
              <MapPin size={10} strokeWidth={1.75} /> {sala.zona}
            </p>
            <div className="mt-3 pt-3 border-t border-white/15 flex items-end justify-between">
              <div>
                <p className="text-blue-200 text-xs">{formatDataLong(data)}</p>
                <p className="text-blue-200 text-xs">{horaInicio} – {horaFim} · {duracao}h</p>
              </div>
              <div className="text-right">
                <p className="text-white text-2xl font-black">{formatAOA(valorTotal)}</p>
                <p className="text-blue-200 text-[10px]">comissão (10%): {formatAOA(comissao)}</p>
              </div>
            </div>
          </div>

          <MetodoPagamentoSelector value={metodo} onChange={setMetodo} />

          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600">
              <AlertTriangle size={13} strokeWidth={2} /> {erro}
            </div>
          )}

          <button
            onClick={handleCriarReserva}
            disabled={reservandoLoading}
            className="w-full bg-gradient-to-r from-[#0B3C74] to-[#00A99D] disabled:opacity-50 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg"
          >
            {reservandoLoading
              ? <><Loader2 size={16} className="animate-spin" /> A confirmar…</>
              : <><CheckCircle2 size={16} strokeWidth={2} /> CONFIRMAR RESERVA</>
            }
          </button>
          <button onClick={() => setStep("contrato")} className="w-full text-gray-400 text-sm py-2">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  /* ── CONTRATO ── */
  if (step === "contrato") {
    const cedente = sala.proprietario?.nome ?? "Entidade Cedente";
    const moradaCedente = sala.proprietario?.morada ?? sala.zona;

    return (
      <div className="pb-10">
        <TopBar titulo="Contrato de Utilização" onBack={() => setStep("horario")} />
        <ProgressBar current="contrato" />

        <div className="px-4 space-y-3">
          {/* Cabeçalho do contrato */}
          <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] rounded-2xl px-5 py-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                <ScrollText size={20} strokeWidth={1.75} className="text-white" />
              </div>
              <div>
                <p className="text-white font-black text-base leading-tight">Contrato de Utilização</p>
                <p className="text-blue-200 text-xs">Temporária de Espaço Clínico</p>
              </div>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-xs space-y-1.5">
              <p className="flex items-center gap-2 text-blue-100">
                <Building2 size={11} strokeWidth={1.75} className="shrink-0" />
                <span className="font-semibold text-white">{cedente}</span> — {TIPO_LABEL[sala.tipo]} · {sala.nome}
              </p>
              <p className="flex items-center gap-2 text-blue-100">
                <Clock size={11} strokeWidth={1.75} className="shrink-0" />
                {formatDataLong(data)} · {horaInicio} – {horaFim} ({duracao}h)
              </p>
              <p className="flex items-center gap-2 text-blue-100">
                <Banknote size={11} strokeWidth={1.75} className="shrink-0" />
                <span className="font-bold text-white">{formatAOA(valorTotal)}</span>
                <span>(+10% comissão MedFreela: {formatAOA(comissao)})</span>
              </p>
            </div>
          </div>

          {/* Corpo do contrato */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Partes */}
            <div className="px-4 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-[#0B3C74]/8 flex items-center justify-center shrink-0">
                  <UserCheck size={13} strokeWidth={2} className="text-[#0B3C74]" />
                </div>
                <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Partes do Contrato</p>
              </div>
              <div className="space-y-3 text-xs text-gray-600">
                <div className="bg-gray-50 rounded-xl px-3 py-3">
                  <p className="font-bold text-gray-800 mb-0.5">Primeira Parte — Cedente</p>
                  <p>{cedente}, com espaço sito em {moradaCedente}, Luanda, Angola.</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-3">
                  <p className="font-bold text-gray-800 mb-0.5">Segunda Parte — Cessionário</p>
                  <p>Profissional de saúde identificado na plataforma MedFreela, com número de cédula registado.</p>
                </div>
              </div>
            </div>

            {/* Objecto */}
            <div className="px-4 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                  <FileText size={13} strokeWidth={2} className="text-[#00A99D]" />
                </div>
                <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Objecto do Contrato</p>
              </div>
              <p className="text-xs text-gray-600 leading-5">
                A Primeira Parte cede temporariamente ao Cessionário a utilização do espaço <span className="font-semibold text-gray-800">{sala.nome}</span> ({TIPO_LABEL[sala.tipo]}), situado em {sala.zona}, pelo período de <span className="font-semibold text-gray-800">{duracao}h</span> no dia <span className="font-semibold text-gray-800">{formatDataLong(data)}</span>, das <span className="font-semibold text-gray-800">{horaInicio}</span> às <span className="font-semibold text-gray-800">{horaFim}</span>.
              </p>
            </div>

            {/* Obrigações do cessionário */}
            <div className="px-4 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Scale size={13} strokeWidth={2} className="text-amber-600" />
                </div>
                <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Obrigações do Cessionário</p>
              </div>
              <ul className="space-y-2 text-xs text-gray-600">
                {[
                  "Utilizar o espaço exclusivamente para prestação de cuidados de saúde.",
                  "Manter o espaço limpo e organizado, entregando-o nas condições em que o recebeu.",
                  "Não sublocar nem ceder o espaço a terceiros.",
                  "Respeitar as normas internas da instituição e os horários acordados.",
                  "Responsabilizar-se pela gestão de resíduos médicos produzidos durante a utilização.",
                  "Assumir total responsabilidade clínica perante os pacientes que atender.",
                  "Reportar imediatamente qualquer avaria ou dano nos equipamentos.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 bg-amber-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={9} strokeWidth={3} className="text-amber-600" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Obrigações do cedente */}
            <div className="px-4 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <ShieldCheck size={13} strokeWidth={2} className="text-emerald-600" />
                </div>
                <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Obrigações do Cedente</p>
              </div>
              <ul className="space-y-2 text-xs text-gray-600">
                {[
                  "Disponibilizar o espaço em boas condições de higiene e funcionamento.",
                  "Garantir o acesso às instalações durante o período contratado.",
                  "Assegurar que os equipamentos incluídos estejam em funcionamento.",
                  "Prestar apoio de recepção e suporte básico durante a utilização.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 bg-emerald-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={9} strokeWidth={3} className="text-emerald-600" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cancelamento */}
            <div className="px-4 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <XCircle size={13} strokeWidth={2} className="text-red-500" />
                </div>
                <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Cancelamento e Reembolso</p>
              </div>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-emerald-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={9} strokeWidth={3} className="text-emerald-600" />
                  </span>
                  Cancelamento com antecedência superior a 24h: reembolso de 100% do valor pago.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-amber-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={9} strokeWidth={3} className="text-amber-500" />
                  </span>
                  Cancelamento com menos de 24h de antecedência: sem direito a reembolso.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-blue-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={9} strokeWidth={3} className="text-blue-500" />
                  </span>
                  O Cedente poderá cancelar com aviso mínimo de 4h, reembolsando integralmente o Cessionário.
                </li>
              </ul>
            </div>

            {/* Lei aplicável */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-[#0B3C74]/8 flex items-center justify-center shrink-0">
                  <Scale size={13} strokeWidth={2} className="text-[#0B3C74]" />
                </div>
                <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Lei Aplicável e Foro</p>
              </div>
              <p className="text-xs text-gray-500 leading-5">
                O presente contrato é regido pela legislação angolana em vigor, nomeadamente o Código Civil da República de Angola e demais legislação aplicável ao arrendamento de espaços comerciais. Quaisquer litígios serão dirimidos nos tribunais de Luanda, com expressa renúncia a qualquer outro.
              </p>
            </div>
          </div>

          {/* Aceitar */}
          <button
            onClick={() => setContratoAceite((v) => !v)}
            className={`w-full flex items-start gap-3 bg-white border-2 rounded-2xl px-4 py-4 transition-colors text-left ${
              contratoAceite ? "border-[#00A99D] bg-teal-50/50" : "border-gray-200"
            }`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              contratoAceite ? "bg-[#00A99D] border-[#00A99D]" : "border-gray-300"
            }`}>
              {contratoAceite && <Check size={12} strokeWidth={3} className="text-white" />}
            </div>
            <p className="text-xs text-gray-700 leading-5">
              Li, compreendi e aceito os termos do presente <span className="font-bold text-gray-900">Contrato de Utilização Temporária de Espaço Clínico</span>, comprometendo-me a cumprir todas as obrigações nele previstas.
            </p>
          </button>

          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600">
              <AlertTriangle size={13} strokeWidth={2} /> {erro}
            </div>
          )}

          <button
            disabled={!contratoAceite || reservandoLoading}
            onClick={handleAssinarContrato}
            className="w-full bg-gradient-to-r from-[#0B3C74] to-[#00A99D] disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#0B3C74]/20 transition-all"
          >
            {reservandoLoading ? (
              <><Loader2 size={16} className="animate-spin" /> A processar…</>
            ) : (
              <><ScrollText size={16} strokeWidth={2} />
              ASSINAR E CONTINUAR
              <ChevronRight size={15} strokeWidth={2.5} /></>
            )}
          </button>
          <button onClick={() => setStep("horario")} className="w-full text-gray-400 text-sm py-2">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  /* ── HORÁRIO ── */
  if (step === "horario") {
    return (
      <div className="pb-10">
        <TopBar titulo="Escolher Horário" onBack={() => setStep("detalhe")} />
        <ProgressBar current="horario" />
        <div className="px-4 space-y-4">
          {/* Data */}
          <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Data</p>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#0B3C74] transition-colors"
            />
          </div>

          {/* Hora */}
          <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Hora de Início</p>
            <div className="flex flex-wrap gap-2">
              {SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setHoraInicio(slot)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                    horaInicio === slot
                      ? "bg-[#0B3C74] text-white border-[#0B3C74]"
                      : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Duração */}
          <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Duração</p>
              <span className="text-[#0B3C74] font-black text-lg">{duracao}h</span>
            </div>
            <input
              type="range" min={1} max={8} value={duracao}
              onChange={(e) => setDuracao(Number(e.target.value))}
              className="w-full accent-[#0B3C74]"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>1h</span><span>4h</span><span>8h</span>
            </div>
            {horaInicio && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                {horaInicio} – {horaFim}
              </p>
            )}
          </div>

          {/* Preço estimado */}
          <div className="bg-gradient-to-r from-[#0B3C74]/8 to-[#00A99D]/8 border border-[#0B3C74]/10 rounded-2xl px-4 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{formatAOA(sala.precoPorHora)}/h × {duracao}h</p>
              <p className="text-[#0B3C74] font-black text-xl mt-0.5">{formatAOA(valorTotal)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0B3C74]/10 flex items-center justify-center">
              <span className="text-[#0B3C74] font-black text-sm">{duracao}h</span>
            </div>
          </div>

          <button
            disabled={!data || !horaInicio}
            onClick={() => setStep("contrato")}
            className="w-full bg-gradient-to-r from-[#0B3C74] to-[#00A99D] disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-[#0B3C74]/20"
          >
            Ver Contrato <ChevronRight size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  /* ── DETALHE ── */
  return (
    <div className="pb-36">
      <TopBar titulo="" back="/medico/salas" />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] px-5 pt-2 pb-8 -mt-px">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-2xl font-black text-white shadow-lg">
            {sala.proprietario?.nome?.charAt(0) ?? "–"}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-white font-bold text-base leading-tight">{sala.proprietario?.nome ?? "–"}</p>
              {sala.proprietario?.verified && <BadgeCheck size={15} strokeWidth={2.5} className="text-emerald-300 shrink-0" />}
            </div>
            <p className="text-blue-200 text-xs mt-0.5 flex items-center gap-1">
              <MapPin size={10} strokeWidth={1.75} /> {sala.zona}
            </p>
          </div>
        </div>

        <h1 className="text-white font-black text-2xl leading-tight">{sala.nome}</h1>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
            {TIPO_LABEL[sala.tipo]}
          </span>
          {sala.disponivel && (
            <span className="bg-emerald-400/30 text-emerald-200 text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full" /> Disponível
            </span>
          )}
          {sala.totalAvaliacoes > 0 && (
            <span className="bg-white/20 text-yellow-200 text-[11px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
              <Star size={10} strokeWidth={2} fill="currentColor" />
              {sala.avaliacaoMedia.toFixed(1)} ({sala.totalAvaliacoes})
            </span>
          )}
        </div>

        {/* Price card */}
        <div className="mt-4 bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-lg shadow-black/10">
          <div>
            <p className="text-xs text-gray-500">Preço por hora</p>
            <p className="text-[#0B3C74] font-black text-2xl">{formatAOA(sala.precoPorHora)}</p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Comissão MedFreela</p>
            <p className="font-semibold text-gray-600">10% incluída</p>
          </div>
        </div>
      </div>

      {/* Equipamentos */}
      <div className="mx-4 mt-4 bg-white rounded-2xl border border-gray-100 px-4 py-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Equipamentos disponíveis</p>
        {equipDisponiveis.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {equipDisponiveis.map((e) => (
              <span key={e} className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                <Check size={11} strokeWidth={2.5} /> {e}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">Sem equipamentos registados.</p>
        )}
      </div>

      {/* Descrição */}
      {sala.descricao && (
        <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 px-4 py-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sobre a Sala</p>
          <p className="text-sm text-gray-700 leading-6">{sala.descricao}</p>
        </div>
      )}

      {/* Cancelamento */}
      <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 px-4 py-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Política de cancelamento</p>
        <div className="space-y-2 text-xs text-gray-600">
          <p className="flex items-center gap-2">
            <span className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
              <Check size={11} strokeWidth={2.5} className="text-emerald-600" />
            </span>
            Cancelamento com &gt;24h — reembolso 100%
          </p>
          <p className="flex items-center gap-2">
            <span className="w-5 h-5 bg-amber-50 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle size={11} strokeWidth={2} className="text-amber-500" />
            </span>
            Cancelamento com &lt;24h — sem reembolso
          </p>
          <p className="flex items-center gap-2">
            <span className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
              <Check size={11} strokeWidth={2.5} className="text-emerald-600" />
            </span>
            Espaço pode cancelar com aviso de 4h
          </p>
        </div>
      </div>

      {/* CTA fixo — posicionado acima do BottomNav */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-4 py-3 z-[60]">
        <button
          onClick={() => setStep("horario")}
          className="w-full bg-gradient-to-r from-[#0B3C74] to-[#00A99D] text-white font-bold py-4 rounded-2xl text-base active:scale-[0.99] transition-transform shadow-lg shadow-[#0B3C74]/20"
        >
          RESERVAR ESTA SALA
        </button>
      </div>
    </div>
  );
}
