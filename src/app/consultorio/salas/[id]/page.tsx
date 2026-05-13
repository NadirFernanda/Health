"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/nav";
import {
  DoorOpen, Check, Loader2, Pencil, Save, X, Trash2,
  ToggleLeft, ToggleRight, Calendar, Star, Banknote,
  AlertTriangle, CheckCircle2, XCircle, ClipboardCheck,
  Clock, User, ChevronRight, AlertCircle,
} from "lucide-react";

function formatAOA(v: number) { return new Intl.NumberFormat("pt-AO").format(v) + " AOA"; }
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

type TipoSala = "CONSULTORIO" | "OBSERVACAO" | "PROCEDIMENTOS";

const TIPO_LABEL: Record<TipoSala, string> = {
  CONSULTORIO: "Consultório",
  OBSERVACAO: "Observação",
  PROCEDIMENTOS: "Procedimentos",
};

const TIPO_OPTIONS: TipoSala[] = ["CONSULTORIO", "OBSERVACAO", "PROCEDIMENTOS"];

const EQUIP: { key: string; label: string }[] = [
  { key: "maca",            label: "Maca de exame" },
  { key: "estetoscopio",    label: "Estetoscópio" },
  { key: "tensiometro",     label: "Tensiómetro" },
  { key: "termometro",      label: "Termómetro" },
  { key: "computador",      label: "Computador" },
  { key: "materiaisBasicos",label: "Materiais básicos" },
  { key: "nebulizador",     label: "Nebulizador" },
  { key: "oximetro",        label: "Oxímetro" },
  { key: "glucometro",      label: "Glucómetro" },
  { key: "desfibrilador",   label: "Desfibrilador (AED)" },
];

type SalaData = {
  id: string; nome: string; tipo: TipoSala; precoPorHora: number;
  zona: string; descricao: string; disponivel: boolean;
  avaliacaoMedia: number; totalAvaliacoes: number; totalReservas: number;
  equipamentos: Record<string, boolean>;
};

type VistoriaReserva = {
  id: string;
  data: string;
  horaInicio: string;
  duracaoHoras: number;
  valorTotal: number;
  terminadoEm: string | null;
  profissional: { id: string; nome: string; especialidade: string };
};

export default function GerirSalaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [sala, setSala] = useState<SalaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [togglingDisp, setTogglingDisp] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [erro, setErro] = useState("");

  // form state
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoSala>("CONSULTORIO");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [equip, setEquip] = useState<Record<string, boolean>>({});

  // vistoria state
  const [vistorias, setVistorias] = useState<VistoriaReserva[]>([]);
  const [loadingVistorias, setLoadingVistorias] = useState(false);
  const [vistoriaAtiva, setVistoriaAtiva] = useState<VistoriaReserva | null>(null);
  const [vistoriaEquip, setVistoriaEquip] = useState<Record<string, boolean>>({});
  const [vistoriaNotas, setVistoriaNotas] = useState("");
  const [enviandoVistoria, setEnviandoVistoria] = useState(false);
  const [vistoriaErro, setVistoriaErro] = useState("");

  useEffect(() => {
    fetch(`/api/consultorio/salas/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: SalaData | null) => {
        if (!d) return;
        setSala(d);
        setNome(d.nome);
        setTipo(d.tipo);
        setPreco(String(d.precoPorHora));
        setDescricao(d.descricao ?? "");
        setEquip(d.equipamentos);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoadingVistorias(true);
    fetch(`/api/consultorio/reservas?salaId=${id}&estado=AGUARDANDO_VISTORIA`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: VistoriaReserva[]) => setVistorias(data))
      .catch(() => {})
      .finally(() => setLoadingVistorias(false));
  }, [id]);

  const toggleDisponivel = async () => {
    if (!sala) return;
    setTogglingDisp(true);
    const res = await fetch(`/api/consultorio/salas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disponivel: !sala.disponivel }),
    });
    if (res.ok) setSala((s) => s ? { ...s, disponivel: !s.disponivel } : s);
    setTogglingDisp(false);
  };

  const salvar = async () => {
    setSalvando(true);
    setErro("");
    const res = await fetch(`/api/consultorio/salas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, tipo, precoPorHora: Number(preco), descricao, ...equip }),
    });
    setSalvando(false);
    if (res.ok) {
      setSala((s) => s ? { ...s, nome, tipo, precoPorHora: Number(preco), descricao, equipamentos: equip } : s);
      setEditando(false);
    } else {
      setErro("Erro ao guardar. Tente novamente.");
    }
  };

  const apagarSala = async () => {
    setApagando(true);
    const res = await fetch(`/api/consultorio/salas/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/consultorio/salas");
    else { setApagando(false); setConfirmDelete(false); }
  };

  const abrirVistoria = (r: VistoriaReserva) => {
    const equipInicial: Record<string, boolean> = {};
    if (sala) {
      EQUIP.forEach(({ key }) => {
        if (sala.equipamentos[key]) equipInicial[key] = true;
      });
    }
    setVistoriaEquip(equipInicial);
    setVistoriaNotas("");
    setVistoriaErro("");
    setVistoriaAtiva(r);
  };

  const submeterVistoria = async (tudoOk: boolean) => {
    if (!vistoriaAtiva) return;
    setEnviandoVistoria(true);
    setVistoriaErro("");
    const res = await fetch(`/api/consultorio/reservas/${vistoriaAtiva.id}/vistoria`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tudo_ok: tudoOk,
        equipamentos: vistoriaEquip,
        notas: vistoriaNotas.trim() || undefined,
      }),
    });
    if (res.ok) {
      setVistorias((prev) => prev.filter((v) => v.id !== vistoriaAtiva.id));
      setVistoriaAtiva(null);
    } else {
      const d = await res.json().catch(() => ({}));
      setVistoriaErro((d as { error?: string }).error ?? "Erro ao submeter vistoria.");
    }
    setEnviandoVistoria(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 size={28} className="animate-spin text-[#00A99D]" />
    </div>
  );
  if (!sala) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-400 gap-2">
      <DoorOpen size={36} strokeWidth={1.25} />
      <p className="text-sm">Sala não encontrada.</p>
    </div>
  );

  const equipDisponiveis = EQUIP.filter(({ key }) => sala.equipamentos[key]);
  const equipVistoria = EQUIP.filter(({ key }) => sala.equipamentos[key]);

  return (
    <div className="pb-28">
      <TopBar titulo="" back="/consultorio/salas" />

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-[#007a72] to-[#00A99D] px-5 pt-2 pb-10 -mt-px">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0 shadow-lg">
              <DoorOpen size={24} strokeWidth={1.75} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl leading-tight">{sala.nome}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  {TIPO_LABEL[sala.tipo]}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                  sala.disponivel ? "bg-emerald-400/30 text-emerald-100" : "bg-red-400/30 text-red-100"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sala.disponivel ? "bg-emerald-300" : "bg-red-300"}`} />
                  {sala.disponivel ? "Disponível" : "Indisponível"}
                </span>
                {vistorias.length > 0 && (
                  <span className="bg-[#00A99D]/40 text-teal-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <ClipboardCheck size={9} strokeWidth={2.5} />
                    {vistorias.length} vistoria{vistorias.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          {!editando && (
            <button
              onClick={() => setEditando(true)}
              className="flex items-center gap-1.5 bg-white/15 border border-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl shrink-0"
            >
              <Pencil size={12} strokeWidth={2} /> Editar
            </button>
          )}
          {editando && (
            <div className="flex gap-2">
              <button
                onClick={() => { setEditando(false); setErro(""); }}
                className="flex items-center gap-1 bg-white/10 border border-white/20 text-white text-xs font-semibold px-2.5 py-2 rounded-xl"
              >
                <X size={12} strokeWidth={2} />
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="flex items-center gap-1 bg-white text-[#007a72] text-xs font-black px-3 py-2 rounded-xl disabled:opacity-60"
              >
                <Save size={12} strokeWidth={2} /> {salvando ? "…" : "Guardar"}
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-center">
            <p className="text-white font-black text-lg">{sala.totalReservas}</p>
            <p className="text-teal-100 text-[10px] font-medium">Reservas</p>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-center">
            <p className="text-white font-black text-lg">
              {sala.totalAvaliacoes > 0 ? sala.avaliacaoMedia.toFixed(1) : "–"}
            </p>
            <p className="text-teal-100 text-[10px] font-medium flex items-center justify-center gap-0.5">
              <Star size={9} fill="currentColor" /> Rating
            </p>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-center">
            <p className="text-white font-black text-sm leading-tight mt-0.5">{formatAOA(sala.precoPorHora)}</p>
            <p className="text-teal-100 text-[10px] font-medium">Por hora</p>
          </div>
        </div>
      </div>

      {/* ── Toggle disponibilidade ── */}
      <div className="mx-4 -mt-5 bg-white rounded-2xl border border-gray-100 shadow-md px-4 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900">Disponibilidade</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {sala.disponivel ? "Médicos podem reservar esta sala" : "Sala fechada para novas reservas"}
          </p>
        </div>
        <button
          onClick={toggleDisponivel}
          disabled={togglingDisp}
          className="shrink-0"
        >
          {togglingDisp
            ? <Loader2 size={28} className="animate-spin text-gray-400" />
            : sala.disponivel
              ? <ToggleRight size={36} strokeWidth={1.5} className="text-[#00A99D]" />
              : <ToggleLeft size={36} strokeWidth={1.5} className="text-gray-400" />
          }
        </button>
      </div>

      {/* ── Vistorias Pendentes ── */}
      {(loadingVistorias || vistorias.length > 0) && (
        <div className="mx-4 mt-3 bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-teal-50 border-b border-teal-100">
            <ClipboardCheck size={15} strokeWidth={2} className="text-[#00A99D] shrink-0" />
            <h3 className="text-xs font-bold text-teal-700 uppercase tracking-widest flex-1">
              Vistorias Pendentes
            </h3>
            {vistorias.length > 0 && (
              <span className="bg-[#00A99D] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {vistorias.length}
              </span>
            )}
          </div>

          {loadingVistorias ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="animate-spin text-teal-400" />
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {vistorias.map((v) => (
                <button
                  key={v.id}
                  onClick={() => abrirVistoria(v)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-teal-50/60 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                    <User size={16} strokeWidth={1.75} className="text-[#00A99D]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{v.profissional.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Calendar size={10} strokeWidth={2} /> {formatDate(v.data)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Clock size={10} strokeWidth={2} /> {v.horaInicio} · {v.duracaoHoras}h
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-[#00A99D]">{formatAOA(v.valorTotal)}</p>
                    <ChevronRight size={14} strokeWidth={2} className="text-teal-400 ml-auto mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Edição / Info ── */}
      <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
          {editando ? "Editar Informações" : "Informações"}
        </h3>

        {editando ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nome da Sala</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00A99D] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Tipo</label>
              <div className="flex gap-2 flex-wrap">
                {TIPO_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      tipo === t ? "bg-[#00A99D] text-white border-[#00A99D]" : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {TIPO_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                Preço por hora (AOA)
              </label>
              <input
                type="number"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                min={100}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00A99D] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                maxLength={400}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00A99D] transition-colors resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Equipamentos</label>
              <div className="grid grid-cols-2 gap-2">
                {EQUIP.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEquip((e) => ({ ...e, [key]: !e[key] }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-colors text-left ${
                      equip[key] ? "border-[#00A99D] bg-teal-50 text-[#00A99D]" : "border-gray-100 text-gray-500"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 ${
                      equip[key] ? "bg-[#00A99D] border-[#00A99D]" : "border-gray-300"
                    }`}>
                      {equip[key] && <Check size={10} strokeWidth={3} className="text-white" />}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {erro && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600">
                <AlertTriangle size={13} strokeWidth={2} /> {erro}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <DoorOpen size={14} strokeWidth={1.75} className="text-[#00A99D]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Tipo</p>
                <p className="font-semibold text-gray-900">{TIPO_LABEL[sala.tipo]}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0B3C74]/8 flex items-center justify-center shrink-0">
                <Banknote size={14} strokeWidth={1.75} className="text-[#0B3C74]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Preço por hora</p>
                <p className="font-bold text-[#00A99D] text-base">{formatAOA(sala.precoPorHora)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <Calendar size={14} strokeWidth={1.75} className="text-[#00A99D]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Reservas realizadas</p>
                <p className="font-semibold text-gray-900">{sala.totalReservas}</p>
              </div>
            </div>
            {sala.descricao && (
              <p className="text-gray-600 text-xs leading-5 bg-gray-50 rounded-xl px-3 py-3">
                {sala.descricao}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Equipamentos (view mode) ── */}
      {!editando && (
        <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Equipamentos</h3>
          {equipDisponiveis.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {equipDisponiveis.map(({ label }) => (
                <span key={label} className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={10} strokeWidth={2.5} /> {label}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Nenhum equipamento registado.</p>
          )}
        </div>
      )}

      {/* ── Zona perigosa ── */}
      {!editando && (
        <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
          <h3 className="text-[11px] font-bold text-red-400 uppercase tracking-widest mb-3">Zona de Perigo</h3>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 text-red-500 text-xs font-semibold border border-red-100 bg-red-50 rounded-xl px-4 py-2.5"
            >
              <Trash2 size={13} strokeWidth={2} /> Remover esta sala
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-3 text-xs text-red-700">
                <AlertTriangle size={13} strokeWidth={2} className="shrink-0 mt-0.5" />
                <p>Tem a certeza? Esta ação é irreversível e a sala ficará invisível para médicos.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-xs font-semibold py-2.5 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={apagarSala}
                  disabled={apagando}
                  className="flex-1 bg-red-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 disabled:opacity-60"
                >
                  {apagando
                    ? <Loader2 size={13} className="animate-spin" />
                    : <><XCircle size={13} strokeWidth={2} /> Sim, remover</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Vistoria Modal ── */}
      {vistoriaAtiva && (
        <div className="fixed inset-0 z-[70] flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !enviandoVistoria && setVistoriaAtiva(null)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-start gap-3 px-5 pt-2 pb-4 border-b border-gray-100 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                <ClipboardCheck size={18} strokeWidth={1.75} className="text-[#00A99D]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black text-gray-900">Vistoria da Sala</h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{vistoriaAtiva.profissional.nome}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Calendar size={10} strokeWidth={2} /> {formatDate(vistoriaAtiva.data)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Clock size={10} strokeWidth={2} /> {vistoriaAtiva.horaInicio} · {vistoriaAtiva.duracaoHoras}h
                  </span>
                </div>
              </div>
              <button
                onClick={() => !enviandoVistoria && setVistoriaAtiva(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0"
              >
                <X size={14} strokeWidth={2.5} className="text-gray-500" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Info banner */}
              <div className="flex items-start gap-2.5 bg-teal-50 border border-teal-100 rounded-xl px-3.5 py-3 text-xs text-teal-700">
                <AlertCircle size={13} strokeWidth={2} className="shrink-0 mt-0.5" />
                <p>Verifique o estado dos equipamentos. Se tudo estiver em ordem, libere o pagamento. Caso contrário, abra uma disputa.</p>
              </div>

              {/* Equipment checklist */}
              {equipVistoria.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Estado dos Equipamentos
                  </p>
                  <div className="space-y-2">
                    {equipVistoria.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setVistoriaEquip((e) => ({ ...e, [key]: !e[key] }))}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors text-left ${
                          vistoriaEquip[key]
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-red-200 bg-red-50"
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                          vistoriaEquip[key]
                            ? "bg-emerald-500 border-emerald-500"
                            : "bg-red-400 border-red-400"
                        }`}>
                          {vistoriaEquip[key]
                            ? <Check size={11} strokeWidth={3} className="text-white" />
                            : <X size={11} strokeWidth={3} className="text-white" />
                          }
                        </span>
                        <span className={`text-sm font-semibold ${vistoriaEquip[key] ? "text-emerald-700" : "text-red-600"}`}>
                          {label}
                        </span>
                        <span className={`ml-auto text-[10px] font-bold uppercase ${vistoriaEquip[key] ? "text-emerald-500" : "text-red-400"}`}>
                          {vistoriaEquip[key] ? "OK" : "Problema"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={vistoriaNotas}
                  onChange={(e) => setVistoriaNotas(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Descreva qualquer problema encontrado…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-300 transition-colors resize-none text-gray-700 placeholder:text-gray-300"
                />
              </div>

              {vistoriaErro && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600">
                  <AlertTriangle size={13} strokeWidth={2} className="shrink-0" /> {vistoriaErro}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="px-5 py-4 border-t border-gray-100 space-y-2.5 shrink-0">
              <p className="text-[11px] text-gray-400 text-center">
                Valor a liberar: <span className="font-bold text-gray-700">{formatAOA(vistoriaAtiva.valorTotal)}</span>
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => submeterVistoria(false)}
                  disabled={enviandoVistoria}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#00A99D] text-white text-sm font-bold py-3.5 rounded-2xl disabled:opacity-50 transition-opacity"
                >
                  {enviandoVistoria
                    ? <Loader2 size={15} className="animate-spin" />
                    : <><AlertTriangle size={14} strokeWidth={2.5} /> Abrir Disputa</>
                  }
                </button>
                <button
                  onClick={() => submeterVistoria(true)}
                  disabled={enviandoVistoria}
                  className="flex-[1.4] flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#00A99D] to-[#007a72] text-white text-sm font-black py-3.5 rounded-2xl disabled:opacity-50 transition-opacity shadow-md"
                >
                  {enviandoVistoria
                    ? <Loader2 size={15} className="animate-spin" />
                    : <><CheckCircle2 size={14} strokeWidth={2.5} /> Liberar Pagamento</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
