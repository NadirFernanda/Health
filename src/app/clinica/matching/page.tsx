"use client";
import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/nav";
import { Search, Send, Inbox, UserCheck, Calendar, Clock, Banknote, X } from "lucide-react";

type Prof = { id: string; nome: string; especialidade: string; tipo: string; foto: string | null; rating: number; verified: boolean; cidade: string | null };

type Convite = {
  id: string; tipo: string; estado: string; mensagem: string | null;
  especialidade: string | null; dataInicio: string | null; dataFim: string | null; valorKwanzas: number | null;
  criadoEm: string; respondidoEm: string | null;
  profissionalDestinatario?: { id: string; nome: string; especialidade: string; foto: string | null; verified: boolean } | null;
};

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

export default function ClinicaMatching() {
  const [convites, setConvites] = useState<Convite[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [searchQ, setSearchQ] = useState("");
  const dq = useDebounce(searchQ, 300);
  const [resultados, setResultados] = useState<Prof[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [selecionado, setSelecionado] = useState<Prof | null>(null);
  const [form, setForm] = useState({ especialidade: "", dataInicio: "", dataFim: "", valorKwanzas: "", mensagem: "" });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const loadConvites = useCallback(() => {
    setLoading(true);
    fetch("/api/convites")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) ? setConvites(d) : setConvites([]))
      .catch(() => setConvites([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadConvites(); }, [loadConvites]);

  useEffect(() => {
    if (dq.length < 2) { setResultados([]); return; }
    setBuscando(true);
    fetch(`/api/buscar/profissionais?q=${encodeURIComponent(dq)}`)
      .then((r) => r.json())
      .then((d) => setResultados(Array.isArray(d) ? d : []))
      .catch(() => setResultados([]))
      .finally(() => setBuscando(false));
  }, [dq]);

  function resetForm() {
    setSearchQ(""); setResultados([]); setSelecionado(null);
    setForm({ especialidade: "", dataInicio: "", dataFim: "", valorKwanzas: "", mensagem: "" });
    setErro(null); setSucesso(false); setMostrarForm(false);
  }

  async function enviar() {
    if (!selecionado) return;
    if (!form.especialidade || !form.dataInicio || !form.dataFim || !form.valorKwanzas)
      { setErro("Preenche todos os campos obrigatórios"); return; }
    setEnviando(true); setErro(null);
    try {
      const r = await fetch("/api/convites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "CLINICA_PARA_MEDICO",
          profissionalDestinatarioId: selecionado.id,
          especialidade: form.especialidade,
          dataInicio: new Date(form.dataInicio).toISOString(),
          dataFim: new Date(form.dataFim).toISOString(),
          valorKwanzas: parseInt(form.valorKwanzas),
          mensagem: form.mensagem || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setErro(d.error ?? "Erro ao enviar"); return; }
      setSucesso(true);
      setTimeout(() => { resetForm(); loadConvites(); }, 1200);
    } finally { setEnviando(false); }
  }

  async function cancelar(id: string) {
    await fetch(`/api/convites/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "cancelar" }) });
    loadConvites();
  }

  return (
    <div>
      <TopBar titulo="Matching" back="/clinica" />

      {/* Botão novo convite */}
      {!mostrarForm && (
        <div className="px-4 pt-4">
          <div className="bg-gradient-to-r from-[#0B3C74] to-[#00A99D] rounded-2xl p-4 text-white mb-4">
            <p className="font-bold text-sm mb-1">Convidar médico diretamente</p>
            <p className="text-xs text-blue-100 mb-3">Procura um profissional e envia-lhe um convite personalizado para o teu turno</p>
            <button onClick={() => setMostrarForm(true)} className="bg-white text-[#0B3C74] rounded-xl py-2 px-4 text-xs font-bold active:opacity-80 transition-opacity">
              Pesquisar profissional
            </button>
          </div>
        </div>
      )}

      {/* Formulário */}
      {mostrarForm && (
        <div className="px-4 pt-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-sm text-[#0B3C74]">Novo convite</p>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>

            {sucesso ? (
              <div className="text-center py-4 text-green-600 font-semibold text-sm">Convite enviado com sucesso!</div>
            ) : (
              <>
                {!selecionado ? (
                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                      placeholder="Pesquisar por nome do médico…"
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0B3C74]" />
                    {buscando && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />}
                    {resultados.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg z-20 mt-1 max-h-48 overflow-y-auto">
                        {resultados.map((r) => (
                          <button key={r.id} onClick={() => { setSelecionado(r); setSearchQ(""); setResultados([]); setForm((f) => ({ ...f, especialidade: r.especialidade })); }}
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center gap-2 text-sm border-b border-gray-50 last:border-0">
                            <UserCheck size={14} className="text-[#00A99D] shrink-0" />
                            <div>
                              <p className="font-semibold text-gray-800">{r.nome}</p>
                              <p className="text-xs text-gray-400">{r.especialidade} · {r.cidade ?? "Angola"}</p>
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
                      <p className="text-xs text-gray-500">{selecionado.especialidade}</p>
                    </div>
                    <button onClick={() => setSelecionado(null)} className="text-gray-400 hover:text-red-500"><X size={13} /></button>
                  </div>
                )}

                <input type="text" placeholder="Especialidade *" value={form.especialidade}
                  onChange={(e) => setForm((f) => ({ ...f, especialidade: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-2 focus:outline-none focus:border-[#0B3C74]" />

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Início *</label>
                    <input type="datetime-local" value={form.dataInicio}
                      onChange={(e) => setForm((f) => ({ ...f, dataInicio: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C74]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Fim *</label>
                    <input type="datetime-local" value={form.dataFim}
                      onChange={(e) => setForm((f) => ({ ...f, dataFim: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C74]" />
                  </div>
                </div>

                <input type="number" placeholder="Valor em AOA *" value={form.valorKwanzas}
                  onChange={(e) => setForm((f) => ({ ...f, valorKwanzas: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-2 focus:outline-none focus:border-[#0B3C74]" />

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

      {/* Lista de convites enviados */}
      <div className="px-4 pb-24 space-y-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Convites enviados</h2>
        {loading ? (
          <div className="flex justify-center pt-8"><div className="w-7 h-7 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" /></div>
        ) : convites.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
            <Inbox size={32} strokeWidth={1.25} className="mx-auto mb-2 text-gray-300" />
            Ainda não enviaste nenhum convite.
          </div>
        ) : (
          convites.map((c) => {
            const badge = estadoBadge[c.estado] ?? { cls: "bg-gray-100 text-gray-500", label: c.estado };
            return (
              <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{c.profissionalDestinatario?.nome ?? "—"}</p>
                    <p className="text-xs text-gray-400">{c.profissionalDestinatario?.especialidade ?? ""}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 mb-1.5">
                  {c.dataInicio && <span className="flex items-center gap-1"><Calendar size={11} />{formatData(c.dataInicio)}</span>}
                  {c.dataInicio && c.dataFim && <span className="flex items-center gap-1"><Clock size={11} />{formatHora(c.dataInicio)} – {formatHora(c.dataFim)}</span>}
                  {c.valorKwanzas && <span className="flex items-center gap-1"><Banknote size={11} />{formatAOA(c.valorKwanzas)}</span>}
                </div>
                {c.mensagem && <p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-2.5 py-1.5 mb-2">"{c.mensagem}"</p>}
                {c.estado === "PENDENTE" && (
                  <button onClick={() => cancelar(c.id)}
                    className="w-full bg-gray-100 text-gray-600 rounded-xl py-2 text-xs font-semibold mt-1 active:opacity-80 transition-opacity">
                    Cancelar convite
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
