"use client";
import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/nav";
import { Search, Send, Inbox, UserCheck, Calendar, Clock, Banknote, X, ChevronDown, ChevronUp, MapPin } from "lucide-react";

type Prof = { id: string; nome: string; especialidade: string; tipo: string; foto: string | null; rating: number; verified: boolean; cidade: string | null };
type Sala = { id: string; nome: string; tipo: string; precoPorHora: number; zona: string };
type Consultorio = { id: string; nome: string; bairro: string | null; cidade: string | null; verified: boolean; salas: Sala[] };

type Convite = {
  id: string; tipo: string; estado: string; mensagem: string | null;
  especialidade: string | null; dataInicio: string | null; dataFim: string | null; valorKwanzas: number | null;
  salaId: string | null; duracaoHoras: number | null; criadoEm: string;
  clinicaRemetente?: { id: string; nome: string; logo: string | null; cidade: string | null; verified: boolean } | null;
  profissionalRemetente?: { id: string; nome: string; especialidade: string; foto: string | null; verified: boolean } | null;
  profissionalDestinatario?: { id: string; nome: string; especialidade: string; foto: string | null; verified: boolean } | null;
  consultorioDestinatario?: { id: string; nome: string; bairro: string | null; cidade: string | null } | null;
  sala?: { id: string; nome: string; tipo: string } | null;
};

type ModoConvite = "MEDICO_PARA_MEDICO" | "MEDICO_PARA_CONSULTORIO" | null;

const estadoBadge: Record<string, { cls: string; label: string }> = {
  PENDENTE:  { cls: "bg-yellow-100 text-yellow-700", label: "Pendente" },
  ACEITE:    { cls: "bg-green-100 text-green-700",   label: "Aceite" },
  RECUSADO:  { cls: "bg-red-100 text-red-600",       label: "Recusado" },
  CANCELADO: { cls: "bg-gray-100 text-gray-500",     label: "Cancelado" },
};

function formatAOA(v: number) { return new Intl.NumberFormat("pt-AO").format(v) + " AOA"; }
function formatData(d: string) { return new Date(d).toLocaleDateString("pt-AO", { weekday: "short", day: "2-digit", month: "short" }); }
function formatHora(d: string) { return new Date(d).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" }); }

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

export default function MedicoMatching() {
  const [aba, setAba] = useState<"recebidos" | "enviados">("recebidos");
  const [convites, setConvites] = useState<Convite[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<ModoConvite>(null);

  // Form state
  const [searchQ, setSearchQ] = useState("");
  const dq = useDebounce(searchQ, 300);
  const [resultados, setResultados] = useState<(Prof | Consultorio)[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [selecionado, setSelecionado] = useState<Prof | Consultorio | null>(null);
  const [salaSelecionada, setSalaSelecionada] = useState<Sala | null>(null);
  const [mostrarSalas, setMostrarSalas] = useState(false);
  const [form, setForm] = useState({ especialidade: "", dataInicio: "", dataFim: "", valorKwanzas: "", duracaoHoras: "2", mensagem: "" });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const loadConvites = useCallback(() => {
    setLoading(true);
    fetch(`/api/convites?direcao=${aba}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) ? setConvites(d) : setConvites([]))
      .catch(() => setConvites([]))
      .finally(() => setLoading(false));
  }, [aba]);

  useEffect(() => { loadConvites(); }, [loadConvites]);

  useEffect(() => {
    if (dq.length < 2 || !modo) { setResultados([]); return; }
    setBuscando(true);
    const url = modo === "MEDICO_PARA_MEDICO"
      ? `/api/buscar/profissionais?q=${encodeURIComponent(dq)}`
      : `/api/buscar/consultorios?q=${encodeURIComponent(dq)}`;
    fetch(url).then((r) => r.json()).then((d) => setResultados(Array.isArray(d) ? d : [])).catch(() => setResultados([])).finally(() => setBuscando(false));
  }, [dq, modo]);

  function resetForm() {
    setSearchQ(""); setResultados([]); setSelecionado(null); setSalaSelecionada(null);
    setForm({ especialidade: "", dataInicio: "", dataFim: "", valorKwanzas: "", duracaoHoras: "2", mensagem: "" });
    setErro(null); setSucesso(false); setModo(null); setMostrarSalas(false);
  }

  async function enviar() {
    if (!selecionado || !modo) return;
    setEnviando(true); setErro(null);
    try {
      let body: Record<string, unknown>;
      if (modo === "MEDICO_PARA_MEDICO") {
        if (!form.especialidade || !form.dataInicio || !form.dataFim || !form.valorKwanzas)
          { setErro("Preenche todos os campos obrigatórios"); setEnviando(false); return; }
        body = {
          tipo: "MEDICO_PARA_MEDICO",
          profissionalDestinatarioId: selecionado.id,
          especialidade: form.especialidade,
          dataInicio: new Date(form.dataInicio).toISOString(),
          dataFim: new Date(form.dataFim).toISOString(),
          valorKwanzas: parseInt(form.valorKwanzas),
          mensagem: form.mensagem || undefined,
        };
      } else {
        if (!salaSelecionada || !form.dataInicio)
          { setErro("Seleciona uma sala e a data"); setEnviando(false); return; }
        body = {
          tipo: "MEDICO_PARA_CONSULTORIO",
          consultorioDestinatarioId: selecionado.id,
          salaId: salaSelecionada.id,
          dataInicio: new Date(form.dataInicio).toISOString(),
          duracaoHoras: parseInt(form.duracaoHoras),
          mensagem: form.mensagem || undefined,
        };
      }
      const r = await fetch("/api/convites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { setErro(d.error ?? "Erro ao enviar"); return; }
      setSucesso(true);
      setTimeout(() => { resetForm(); loadConvites(); setAba("enviados"); }, 1200);
    } finally { setEnviando(false); }
  }

  async function responder(conviteId: string, acao: "aceitar" | "recusar" | "cancelar") {
    await fetch(`/api/convites/${conviteId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao }) });
    loadConvites();
  }

  const pendentes = convites.filter((c) => c.estado === "PENDENTE").length;

  return (
    <div>
      <TopBar titulo="Matching" back="/medico" />

      {/* Abas */}
      <div className="flex border-b border-gray-100 bg-white sticky top-0 z-10">
        {(["recebidos", "enviados"] as const).map((a) => (
          <button key={a} onClick={() => setAba(a)} className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${aba === a ? "text-[#0B3C74]" : "text-gray-400"}`}>
            {a === "recebidos" ? "Recebidos" : "Enviados"}
            {a === "recebidos" && pendentes > 0 && aba !== "recebidos" && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendentes}</span>
            )}
            {aba === a && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0B3C74]" />}
          </button>
        ))}
      </div>

      {/* Novo convite */}
      {!modo && (
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#0B3C74] to-[#00A99D] rounded-2xl p-4 text-white mb-4">
            <p className="font-bold text-sm mb-1">Enviar convite direto</p>
            <p className="text-xs text-blue-100 mb-3">Convida um colega como substituto ou reserva uma sala específica</p>
            <div className="flex gap-2">
              <button onClick={() => setModo("MEDICO_PARA_MEDICO")} className="flex-1 bg-white/20 hover:bg-white/30 rounded-xl py-2 px-3 text-xs font-semibold transition-colors">
                Colega substituto
              </button>
              <button onClick={() => setModo("MEDICO_PARA_CONSULTORIO")} className="flex-1 bg-white/20 hover:bg-white/30 rounded-xl py-2 px-3 text-xs font-semibold transition-colors">
                Sala / Consultório
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulário de convite */}
      {modo && (
        <div className="px-4 pt-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-sm text-[#0B3C74]">
                {modo === "MEDICO_PARA_MEDICO" ? "Convidar colega substituto" : "Solicitar sala / consultório"}
              </p>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>

            {sucesso ? (
              <div className="text-center py-4 text-green-600 font-semibold text-sm">Convite enviado com sucesso!</div>
            ) : (
              <>
                {/* Search */}
                {!selecionado ? (
                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                      placeholder={modo === "MEDICO_PARA_MEDICO" ? "Pesquisar por nome do colega…" : "Pesquisar consultório…"}
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0B3C74]"
                    />
                    {buscando && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />}
                    {resultados.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg z-20 mt-1 max-h-48 overflow-y-auto">
                        {resultados.map((r) => (
                          <button key={r.id} onClick={() => { setSelecionado(r); setSearchQ(""); setResultados([]); }}
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center gap-2 text-sm border-b border-gray-50 last:border-0">
                            <UserCheck size={14} className="text-[#00A99D] shrink-0" />
                            <div>
                              <p className="font-semibold text-gray-800">{r.nome}</p>
                              <p className="text-xs text-gray-400">{modo === "MEDICO_PARA_MEDICO" ? (r as Prof).especialidade : (r as Consultorio).bairro ?? (r as Consultorio).cidade ?? ""}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-3 bg-[#0B3C74]/5 rounded-xl px-3 py-2.5">
                    <UserCheck size={14} className="text-[#0B3C74] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0B3C74] truncate">{selecionado.nome}</p>
                      <p className="text-xs text-gray-500">{modo === "MEDICO_PARA_MEDICO" ? (selecionado as Prof).especialidade : `${(selecionado as Consultorio).bairro ?? ""} ${(selecionado as Consultorio).cidade ?? ""}`.trim()}</p>
                    </div>
                    <button onClick={() => { setSelecionado(null); setSalaSelecionada(null); }} className="text-gray-400 hover:text-red-500"><X size={13} /></button>
                  </div>
                )}

                {/* Seleção de sala para MEDICO_PARA_CONSULTORIO */}
                {modo === "MEDICO_PARA_CONSULTORIO" && selecionado && (
                  <div className="mb-3">
                    <button onClick={() => setMostrarSalas(!mostrarSalas)}
                      className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700">
                      <span className={salaSelecionada ? "font-semibold text-[#0B3C74]" : "text-gray-400"}>
                        {salaSelecionada ? `${salaSelecionada.nome} — ${formatAOA(salaSelecionada.precoPorHora)}/h` : "Selecionar sala…"}
                      </span>
                      {mostrarSalas ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {mostrarSalas && (
                      <div className="mt-1 border border-gray-100 rounded-xl overflow-hidden">
                        {(selecionado as Consultorio).salas?.map((s) => (
                          <button key={s.id} onClick={() => { setSalaSelecionada(s); setMostrarSalas(false); }}
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center justify-between text-sm border-b border-gray-50 last:border-0">
                            <span className="font-medium text-gray-800">{s.nome} <span className="text-xs text-gray-400 font-normal">({s.tipo})</span></span>
                            <span className="text-xs font-semibold text-[#00A99D]">{formatAOA(s.precoPorHora)}/h</span>
                          </button>
                        ))}
                        {!(selecionado as Consultorio).salas?.length && (
                          <p className="text-xs text-gray-400 px-3 py-3">Sem salas disponíveis neste consultório</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Campos do formulário */}
                {modo === "MEDICO_PARA_MEDICO" && (
                  <input type="text" placeholder="Especialidade *" value={form.especialidade}
                    onChange={(e) => setForm((f) => ({ ...f, especialidade: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-2 focus:outline-none focus:border-[#0B3C74]" />
                )}

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{modo === "MEDICO_PARA_MEDICO" ? "Início *" : "Data *"}</label>
                    <input type="datetime-local" value={form.dataInicio}
                      onChange={(e) => setForm((f) => ({ ...f, dataInicio: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C74]" />
                  </div>
                  {modo === "MEDICO_PARA_MEDICO" ? (
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Fim *</label>
                      <input type="datetime-local" value={form.dataFim}
                        onChange={(e) => setForm((f) => ({ ...f, dataFim: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C74]" />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Duração (horas)</label>
                      <input type="number" min={1} max={12} value={form.duracaoHoras}
                        onChange={(e) => setForm((f) => ({ ...f, duracaoHoras: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C74]" />
                    </div>
                  )}
                </div>

                {modo === "MEDICO_PARA_MEDICO" && (
                  <input type="number" placeholder="Valor em AOA *" value={form.valorKwanzas}
                    onChange={(e) => setForm((f) => ({ ...f, valorKwanzas: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-2 focus:outline-none focus:border-[#0B3C74]" />
                )}

                <textarea placeholder="Mensagem (opcional)" value={form.mensagem}
                  onChange={(e) => setForm((f) => ({ ...f, mensagem: e.target.value }))}
                  rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none mb-3 focus:outline-none focus:border-[#0B3C74]" />

                {erro && <p className="text-xs text-red-600 mb-2">{erro}</p>}

                <button onClick={enviar} disabled={enviando || !selecionado}
                  className="w-full bg-[#0B3C74] text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 active:opacity-80 transition-opacity">
                  {enviando ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
                  Enviar convite
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="px-4 pb-24 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-10"><div className="w-7 h-7 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" /></div>
        ) : convites.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
            <Inbox size={32} strokeWidth={1.25} className="mx-auto mb-2 text-gray-300" />
            {aba === "recebidos" ? "Nenhum convite recebido." : "Ainda não enviaste nenhum convite."}
          </div>
        ) : (
          convites.map((c) => {
            const badge = estadoBadge[c.estado] ?? { cls: "bg-gray-100 text-gray-500", label: c.estado };
            const remetente = c.clinicaRemetente?.nome ?? c.profissionalRemetente?.nome ?? "—";
            const destinatario = c.profissionalDestinatario?.nome ?? c.consultorioDestinatario?.nome ?? "—";
            const titulo = aba === "recebidos" ? remetente : destinatario;
            const subtipo =
              c.tipo === "MEDICO_PARA_MEDICO" ? "Substituto" :
              c.tipo === "CLINICA_PARA_MEDICO" ? "Da clínica" :
              "Sala / Consultório";

            return (
              <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{titulo}</p>
                    <p className="text-xs text-gray-400">{subtipo}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                </div>

                {c.especialidade && (
                  <p className="text-xs text-gray-600 mb-1.5 font-medium">{c.especialidade}</p>
                )}

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 mb-1.5">
                  {c.dataInicio && (
                    <span className="flex items-center gap-1"><Calendar size={11} strokeWidth={1.75} />{formatData(c.dataInicio)}</span>
                  )}
                  {c.dataInicio && c.dataFim && (
                    <span className="flex items-center gap-1"><Clock size={11} strokeWidth={1.75} />{formatHora(c.dataInicio)} – {formatHora(c.dataFim)}</span>
                  )}
                  {c.valorKwanzas && (
                    <span className="flex items-center gap-1"><Banknote size={11} strokeWidth={1.75} />{formatAOA(c.valorKwanzas)}</span>
                  )}
                  {c.sala && (
                    <span className="flex items-center gap-1"><MapPin size={11} strokeWidth={1.75} />{c.sala.nome}</span>
                  )}
                </div>
                {c.mensagem && <p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-2.5 py-1.5 mb-2">"{c.mensagem}"</p>}

                {c.estado === "PENDENTE" && (
                  <div className="flex gap-2 mt-2">
                    {aba === "recebidos" ? (
                      <>
                        <button onClick={() => responder(c.id, "aceitar")}
                          className="flex-1 bg-[#0B3C74] text-white rounded-xl py-2 text-xs font-semibold active:opacity-80 transition-opacity">
                          Aceitar
                        </button>
                        <button onClick={() => responder(c.id, "recusar")}
                          className="flex-1 bg-red-50 text-red-600 border border-red-100 rounded-xl py-2 text-xs font-semibold active:opacity-80 transition-opacity">
                          Recusar
                        </button>
                      </>
                    ) : (
                      <button onClick={() => responder(c.id, "cancelar")}
                        className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2 text-xs font-semibold active:opacity-80 transition-opacity">
                        Cancelar convite
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
