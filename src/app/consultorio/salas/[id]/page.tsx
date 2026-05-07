"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/nav";
import {
  DoorOpen, Check, Loader2, Pencil, Save, X, Trash2,
  ToggleLeft, ToggleRight, Calendar, Star, Banknote,
  AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";

function formatAOA(v: number) { return new Intl.NumberFormat("pt-AO").format(v) + " AOA"; }

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

            {/* Equipamentos no modo edição */}
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
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Calendar size={14} strokeWidth={1.75} className="text-amber-600" />
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
    </div>
  );
}
