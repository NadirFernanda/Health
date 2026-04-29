"use client";
import { useState } from "react";
import { TopBar } from "@/components/nav";
import { useRouter } from "next/navigation";
import { Sparkles, CheckSquare, Square } from "lucide-react";

const especialidades = [
  "Medicina Geral", "Pediatria", "Ginecologia", "Cardiologia",
  "Cirurgia", "Ortopedia", "Dermatologia", "Psiquiatria",
  "Neurologia", "Oftalmologia", "Urologia", "Anestesiologia",
];

const equipamentosOpcoes = [
  { key: "maca", label: "Maca de exame" },
  { key: "estetoscopio", label: "Estetoscópio" },
  { key: "tensiometro", label: "Tensiômetro" },
  { key: "termometro", label: "Termómetro" },
  { key: "computador", label: "Computador / Sistema" },
  { key: "materiaisBasicos", label: "Materiais básicos" },
  { key: "nebulizador", label: "Nebulizador" },
  { key: "oximetro", label: "Oxímetro de pulso" },
  { key: "glucometro", label: "Glucómetro" },
  { key: "desfibrilador", label: "Desfibrilador" },
];

export default function PublicarPlantaoMedico() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [publicado, setPublicado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    especialidade: "",
    dataInicio: "",
    horaInicio: "08:00",
    dataFim: "",
    horaFim: "20:00",
    valor: "",
    descricao: "",
  });

  const [equipamentos, setEquipamentos] = useState<Record<string, boolean>>({
    maca: false, estetoscopio: false, tensiometro: false,
    termometro: false, computador: false, materiaisBasicos: true,
    nebulizador: false, oximetro: false, glucometro: false, desfibrilador: false,
  });

  const toggleEquip = (key: string) =>
    setEquipamentos((prev) => ({ ...prev, [key]: !prev[key] }));

  const set = (k: string, v: string | number) => setForm((prev) => ({ ...prev, [k]: v }));

  async function publicar() {
    setLoading(true);
    setErro("");
    try {
      const dataInicio = new Date(`${form.dataInicio}T${form.horaInicio}:00`).toISOString();
      const dataFim = new Date(`${form.dataFim}T${form.horaFim}:00`).toISOString();
      const res = await fetch("/api/medico/publicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoProfissional: "MEDICO",
          especialidade: form.especialidade,
          dataInicio,
          dataFim,
          valorKwanzas: form.valor,
          vagas: 1,
          descricao: form.descricao,
          ...equipamentos,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.error ?? "Erro ao publicar");
        setLoading(false);
        return;
      }
      setPublicado(true);
    } catch {
      setErro("Erro de rede. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (publicado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Sparkles size={40} strokeWidth={1.5} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Vaga publicada!</h2>
        <p className="text-gray-500 mt-2 text-sm leading-6">
          Médicos com especialidade compatível serão notificados e podem candidatar-se ao teu plantão.
        </p>
        <button
          onClick={() => router.push("/medico/plantoes")}
          className="mt-6 bg-[#1A6FBB] text-white font-bold px-8 py-3 rounded-2xl"
        >
          Ver os meus plantões
        </button>
      </div>
    );
  }

  return (
    <div>
      <TopBar titulo="Publicar Vaga de Substituto" back="/medico" />

      {/* Aviso contextual */}
      <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-5">
        <p className="font-bold mb-0.5">Não podes comparecer ao plantão?</p>
        Publica a vaga, define o valor que pagarás ao substituto, e escolhe o médico candidato. O pagamento é debitado da tua carteira após aceitação.
      </div>

      {/* Progress */}
      <div className="px-4 pt-4">
        <div className="flex gap-1.5">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-[#1A6FBB]" : "bg-gray-200"}`} />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Passo {step} de 2</p>
      </div>

      {/* Step 1 — Detalhes */}
      {step === 1 && (
        <div className="px-4 pt-5 space-y-4">
          <h2 className="font-bold text-gray-900">Detalhes do Plantão</h2>

          {/* Especialidade */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Especialidade *</label>
            <select
              value={form.especialidade}
              onChange={(e) => set("especialidade", e.target.value)}
              className="mt-1.5 w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#1A6FBB]"
            >
              <option value="">Selecionar...</option>
              {especialidades.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Data início *</label>
              <input type="date" value={form.dataInicio} onChange={(e) => set("dataInicio", e.target.value)}
                className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A6FBB]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Hora início *</label>
              <input type="time" value={form.horaInicio} onChange={(e) => set("horaInicio", e.target.value)}
                className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A6FBB]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Data fim *</label>
              <input type="date" value={form.dataFim} onChange={(e) => set("dataFim", e.target.value)}
                className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A6FBB]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Hora fim *</label>
              <input type="time" value={form.horaFim} onChange={(e) => set("horaFim", e.target.value)}
                className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A6FBB]" />
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Valor a pagar ao substituto (AOA) *</label>
            <input
              type="number"
              placeholder="ex: 25000"
              value={form.valor}
              onChange={(e) => set("valor", e.target.value)}
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A6FBB]"
            />
            <p className="text-xs text-gray-400 mt-1">Este valor será debitado da tua carteira após aceitação.</p>
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Notas para o substituto</label>
            <textarea
              rows={3}
              placeholder="Ex: plantão na Clínica Horizonte, turno de urgência pediátrica..."
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A6FBB] resize-none"
            />
          </div>

          <button
            disabled={!form.especialidade || !form.dataInicio || !form.dataFim || !form.valor}
            onClick={() => setStep(2)}
            className="w-full bg-[#1A6FBB] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-2xl mt-2"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Step 2 — Equipamentos disponíveis */}
      {step === 2 && (
        <div className="px-4 pt-5 space-y-4">
          <h2 className="font-bold text-gray-900">Equipamentos disponíveis no local</h2>
          <p className="text-sm text-gray-500">Indica o que o substituto terá à disposição no local do plantão.</p>

          <div className="space-y-2">
            {equipamentosOpcoes.map((eq) => (
              <button
                key={eq.key}
                onClick={() => toggleEquip(eq.key)}
                className="w-full flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 text-left"
              >
                {equipamentos[eq.key]
                  ? <CheckSquare size={18} strokeWidth={2} className="text-[#1A6FBB] shrink-0" />
                  : <Square size={18} strokeWidth={1.75} className="text-gray-300 shrink-0" />}
                <span className="text-sm text-gray-800">{eq.label}</span>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="bg-[#f0f6ff] border border-blue-100 rounded-xl px-4 py-3 text-sm space-y-1">
            <p className="font-bold text-[#1A6FBB] text-xs uppercase tracking-wide mb-1.5">Resumo da vaga</p>
            <p className="text-gray-700"><span className="font-semibold">Especialidade:</span> {form.especialidade}</p>
            <p className="text-gray-700"><span className="font-semibold">Início:</span> {form.dataInicio} às {form.horaInicio}</p>
            <p className="text-gray-700"><span className="font-semibold">Fim:</span> {form.dataFim} às {form.horaFim}</p>
            <p className="text-gray-700"><span className="font-semibold">Valor:</span> {parseInt(form.valor || "0").toLocaleString("pt-AO")} AOA</p>
          </div>

          {erro && <p className="text-xs text-red-600 font-medium">{erro}</p>}

          <div className="flex gap-3 pb-6">
            <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl">
              Voltar
            </button>
            <button
              onClick={publicar}
              disabled={loading}
              className="flex-1 bg-[#1A6FBB] disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl"
            >
              {loading ? "A publicar..." : "Publicar vaga"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
