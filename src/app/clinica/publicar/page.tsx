"use client";
import { useState } from "react";
import { TopBar } from "@/components/nav";
import { useRouter } from "next/navigation";

const especialidades = [
  "Medicina Geral", "Pediatria", "Ginecologia", "Cardiologia",
  "Cirurgia", "Ortopedia", "Dermatologia", "Psiquiatria",
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

export default function PublicarPlantao() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [publicado, setPublicado] = useState(false);

  const [form, setForm] = useState({
    especialidade: "",
    dataInicio: "",
    horaInicio: "08:00",
    dataFim: "",
    horaFim: "20:00",
    valor: "",
    vagas: 1,
    descricao: "",
  });

  const [equipamentos, setEquipamentos] = useState<Record<string, boolean>>({
    maca: true, estetoscopio: true, tensiometro: true,
    termometro: true, computador: true, materiaisBasicos: true,
    nebulizador: false, oximetro: false, glucometro: false, desfibrilador: false,
  });

  const toggleEquip = (key: string) =>
    setEquipamentos((prev) => ({ ...prev, [key]: !prev[key] }));

  if (publicado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">🎉</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Plantão publicado!</h2>
        <p className="text-gray-500 mt-2 text-sm leading-6">
          Os médicos com especialidade compatível serão notificados agora.
        </p>
        <button
          onClick={() => router.push("/clinica")}
          className="mt-6 bg-[#1A6FBB] text-white font-bold px-8 py-3 rounded-2xl"
        >
          Voltar ao painel
        </button>
      </div>
    );
  }

  return (
    <div>
      <TopBar titulo="Publicar Plantão" back="/clinica" />

      {/* Progress */}
      <div className="px-4 pt-3">
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-[#1A6FBB]" : "bg-gray-200"}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Passo {step} de 3</p>
      </div>

      {/* Step 1 — Informações */}
      {step === 1 && (
        <div className="px-4 pt-5 space-y-4">
          <h2 className="font-bold text-gray-900">Informações do Plantão</h2>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Especialidade *</label>
            <select
              value={form.especialidade}
              onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:border-[#1A6FBB]"
            >
              <option value="">Selecionar especialidade...</option>
              {especialidades.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Data início *</label>
              <input type="date" value={form.dataInicio}
                onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#1A6FBB]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Hora início *</label>
              <input type="time" value={form.horaInicio}
                onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#1A6FBB]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Data fim *</label>
              <input type="date" value={form.dataFim}
                onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#1A6FBB]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Hora fim *</label>
              <input type="time" value={form.horaFim}
                onChange={(e) => setForm({ ...form, horaFim: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#1A6FBB]" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Valor (AOA) *</label>
            <input type="number" placeholder="Ex: 15000" value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#1A6FBB]" />
            <p className="text-xs text-gray-400 mt-1">O médico receberá este valor integralmente</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Número de vagas</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setForm({ ...form, vagas: Math.max(1, form.vagas - 1) })}
                className="w-9 h-9 rounded-xl bg-gray-100 font-bold text-lg">−</button>
              <span className="font-bold text-lg text-gray-900 w-6 text-center">{form.vagas}</span>
              <button onClick={() => setForm({ ...form, vagas: Math.min(10, form.vagas + 1) })}
                className="w-9 h-9 rounded-xl bg-gray-100 font-bold text-lg">+</button>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!form.especialidade || !form.dataInicio || !form.valor}
            className="w-full bg-[#1A6FBB] disabled:opacity-40 text-white font-bold py-4 rounded-2xl mt-2"
          >
            PRÓXIMO →
          </button>
        </div>
      )}

      {/* Step 2 — Equipamentos */}
      {step === 2 && (
        <div className="px-4 pt-5 space-y-4">
          <h2 className="font-bold text-gray-900">Equipamentos Disponíveis</h2>
          <p className="text-sm text-gray-500">Indique o que está disponível na sala. O médico verá esta informação antes de se candidatar.</p>
          <div className="space-y-2">
            {equipamentosOpcoes.map((e) => (
              <button
                key={e.key}
                onClick={() => toggleEquip(e.key)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-colors text-left ${
                  equipamentos[e.key]
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-white border-gray-200 text-gray-500"
                }`}
              >
                <span className="text-lg">{equipamentos[e.key] ? "✅" : "⬜"}</span>
                <span className="text-sm font-medium">{e.label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-2xl text-sm">
              ← Voltar
            </button>
            <button onClick={() => setStep(3)} className="flex-1 bg-[#1A6FBB] text-white font-bold py-3.5 rounded-2xl text-sm">
              PRÓXIMO →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Preview */}
      {step === 3 && (
        <div className="px-4 pt-5 space-y-4">
          <h2 className="font-bold text-gray-900">Pré-visualização</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2 text-sm">
            <p className="font-bold text-gray-900 text-base">{form.especialidade}</p>
            <p className="text-gray-600">📅 {form.dataInicio} · {form.horaInicio} – {form.horaFim}</p>
            <p className="text-[#1A6FBB] font-bold text-lg">{parseInt(form.valor || "0").toLocaleString()} AOA</p>
            <p className="text-gray-500">👥 {form.vagas} vaga(s)</p>
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-400 mb-2 font-semibold">EQUIPAMENTOS</p>
              <div className="flex flex-wrap gap-1.5">
                {equipamentosOpcoes
                  .filter((e) => equipamentos[e.key])
                  .map((e) => (
                    <span key={e.key} className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">✓ {e.label}</span>
                  ))}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
            💡 A plataforma retém <strong>10% de comissão</strong> sobre o valor do plantão. Será cobrado <strong>{Math.round(parseInt(form.valor || "0") * 1.1).toLocaleString()} AOA</strong> no total.
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-2xl text-sm">
              ← Voltar
            </button>
            <button onClick={() => setPublicado(true)} className="flex-1 bg-[#27AE60] text-white font-bold py-3.5 rounded-2xl text-sm">
              PUBLICAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
