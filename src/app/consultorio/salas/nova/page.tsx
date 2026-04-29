"use client";
import { useState } from "react";
import { TopBar } from "@/components/nav";
import { useRouter } from "next/navigation";
import { DoorOpen, MapPin, Banknote, Check, ChevronRight } from "lucide-react";

const tipoOpcoes = [
  { key: "CONSULTORIO", label: "Consultório", desc: "Consultas gerais e especializadas" },
  { key: "OBSERVACAO", label: "Observação", desc: "Observação e monitorização de doentes" },
  { key: "PROCEDIMENTOS", label: "Procedimentos", desc: "Procedimentos cirúrgicos menores" },
];

const equipamentosOpcoes = [
  { key: "maca", label: "Maca" },
  { key: "estetoscopio", label: "Estetoscópio" },
  { key: "tensiometro", label: "Tensiômetro" },
  { key: "termometro", label: "Termómetro" },
  { key: "computador", label: "Computador / Tablet" },
  { key: "materiaisBasicos", label: "Materiais básicos de penso" },
  { key: "nebulizador", label: "Nebulizador" },
  { key: "oximetro", label: "Oxímetro" },
  { key: "glucometro", label: "Glucómetro" },
  { key: "desfibrilador", label: "Desfibrilador (AED)" },
];

const equipamentosIniciais: Record<string, boolean> = {
  maca: false, estetoscopio: false, tensiometro: false, termometro: false,
  computador: false, materiaisBasicos: false, nebulizador: false,
  oximetro: false, glucometro: false, desfibrilador: false,
};

export default function NovaSalaConsultorio() {
  const router = useRouter();
  const [passo, setPasso] = useState(1);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [equip, setEquip] = useState<Record<string, boolean>>(equipamentosIniciais);

  const passo1Valido = nome.trim().length >= 2 && tipo && Number(preco) >= 100;

  const toggleEquip = (key: string) => setEquip((p) => ({ ...p, [key]: !p[key] }));

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/consultorio/salas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          tipo,
          precoPorHora: Number(preco),
          descricao,
          ...equip,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erro ao publicar sala.");
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Erro de ligação. Tente novamente.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-6 text-center">
        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mb-4">
          <DoorOpen size={40} strokeWidth={1.5} className="text-[#00A99D]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Sala Publicada!</h2>
        <p className="text-gray-500 mt-2 text-sm">
          A sua sala está visível para médicos em Luanda.<br />
          Receberá notificação quando houver uma reserva.
        </p>
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-4 text-left w-full max-w-xs space-y-2 text-sm text-gray-700">
          <p className="flex items-center gap-1.5"><DoorOpen size={14} strokeWidth={1.75} className="text-[#00A99D]" /> <strong>{nome}</strong></p>
          <p className="flex items-center gap-1.5"><Banknote size={14} strokeWidth={1.75} className="text-[#00A99D]" /> {Number(preco).toLocaleString("pt-AO")} AOA/hora</p>
        </div>
        <button onClick={() => router.push("/consultorio/salas")} className="mt-6 bg-[#00A99D] text-white font-bold px-8 py-3 rounded-2xl w-full max-w-xs">
          Ver as minhas salas
        </button>
        <button onClick={() => router.push("/consultorio")} className="mt-2 text-gray-400 text-sm py-2">
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div>
      <TopBar titulo="Nova Sala" back="/consultorio/salas" />

      {/* Progress */}
      <div className="px-4 pt-4">
        <div className="flex gap-2">
          {[1, 2].map((n) => (
            <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${n <= passo ? "bg-[#00A99D]" : "bg-gray-200"}`} />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Passo {passo} de 2</p>
      </div>

      {/* Passo 1 */}
      {passo === 1 && (
        <div className="px-4 pt-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Informações da Sala</h2>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nome da sala *</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="ex: Consultório A"
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#00A99D]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Tipo de sala *</label>
            <div className="space-y-2">
              {tipoOpcoes.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTipo(t.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
                    tipo === t.key ? "border-[#00A99D] bg-teal-50" : "border-gray-100 bg-white"
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{t.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                  </div>
                  {tipo === t.key && <Check size={16} strokeWidth={2.5} className="text-[#00A99D]" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
              Preço por hora (AOA) *
            </label>
            <input
              type="number"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="ex: 5000"
              min={100}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#00A99D]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva a sala, localização exacta, condições, etc."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#00A99D] resize-none"
            />
          </div>

          <button
            type="button"
            disabled={!passo1Valido}
            onClick={() => setPasso(2)}
            className="w-full bg-[#00A99D] disabled:opacity-40 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-1"
          >
            Continuar <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Passo 2 — Equipamentos */}
      {passo === 2 && (
        <div className="px-4 pt-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Equipamentos disponíveis</h2>
            <p className="text-gray-500 text-sm mt-1">Seleccione os equipamentos incluídos na sala</p>
          </div>

          <div className="space-y-2">
            {equipamentosOpcoes.map((e) => (
              <button
                key={e.key}
                type="button"
                onClick={() => toggleEquip(e.key)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-colors ${
                  equip[e.key] ? "border-[#00A99D] bg-teal-50" : "border-gray-100 bg-white"
                }`}
              >
                <span className={`text-sm font-medium ${equip[e.key] ? "text-[#00A99D]" : "text-gray-700"}`}>{e.label}</span>
                {equip[e.key] && <Check size={16} strokeWidth={2.5} className="text-[#00A99D]" />}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPasso(1)}
              className="flex-1 border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl text-sm"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-[#00A99D] disabled:opacity-40 text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A publicar...</>
              ) : "Publicar sala"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
