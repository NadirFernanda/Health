"use client";
import { useState } from "react";
import { TipoSala, ZonaLuanda, Equipamentos } from "@/lib/mock-data";
import { TopBar } from "@/components/nav";
import { useRouter } from "next/navigation";
import { Building2, DoorOpen, MapPin, Banknote, Wrench, Check, ChevronLeft, ChevronRight, Square, CheckSquare, Info } from "lucide-react";

const zonaOpcoes: ZonaLuanda[] = ["Centralidade Horizonte", "Talatona", "Miramar", "Alvalade", "Kilamba"];
const tipoOpcoes: { key: TipoSala; label: string; desc: string }[] = [
  { key: "CONSULTORIO", label: "Consultório", desc: "Consultas gerais e especializadas" },
  { key: "OBSERVACAO", label: "Observação", desc: "Observação e monitorização de doentes" },
  { key: "PROCEDIMENTOS", label: "Procedimentos", desc: "Procedimentos cirúrgicos menores" },
];

const equipamentosOpcoes: { key: keyof Equipamentos; label: string }[] = [
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

const equipamentosIniciais: Equipamentos = {
  maca: false, estetoscopio: false, tensiometro: false, termometro: false,
  computador: false, materiaisBasicos: false, nebulizador: false,
  oximetro: false, glucometro: false, desfibrilador: false,
};

export default function NovaSala() {
  const router = useRouter();
  const [passo, setPasso] = useState(1);
  const [done, setDone] = useState(false);

  // Passo 1
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoSala | "">("");
  const [preco, setPreco] = useState("");
  const [zona, setZona] = useState<ZonaLuanda | "">("");

  // Passo 2
  const [equip, setEquip] = useState<Equipamentos>(equipamentosIniciais);

  // Passo 3
  const [descricao, setDescricao] = useState("");

  const toggleEquip = (key: keyof Equipamentos) => {
    setEquip((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const passo1Valido = nome.trim() && tipo && preco && zona;
  const equipCount = Object.values(equip).filter(Boolean).length;

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Building2 size={40} strokeWidth={1.5} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Sala Publicada!</h2>
        <p className="text-gray-500 mt-2 text-sm leading-6">
          O seu consultório está visível para profissionais de saúde em Luanda.<br />
          Receberá notificação quando houver uma reserva.
        </p>
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-4 text-left w-full max-w-xs space-y-2 text-sm text-gray-700">
          <p className="inline-flex items-center gap-1"><DoorOpen size={14} strokeWidth={1.75} /> <strong>{nome}</strong></p>
          <p className="inline-flex items-center gap-1"><MapPin size={14} strokeWidth={1.75} /> {zona}</p>
          <p className="inline-flex items-center gap-1"><Banknote size={14} strokeWidth={1.75} /> {Number(preco).toLocaleString("pt-AO")} AOA/hora</p>
          <p className="inline-flex items-center gap-1"><Wrench size={14} strokeWidth={1.75} /> {equipCount} equipamento(s)</p>
        </div>
        <button
          onClick={() => router.push("/clinica/salas")}
          className="mt-6 bg-brand-500 text-white font-bold px-8 py-3 rounded-2xl w-full max-w-xs"
        >
          Ver minhas salas
        </button>
        <button onClick={() => router.push("/clinica")} className="mt-2 text-gray-400 text-sm py-2">
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div>
      <TopBar titulo="Nova Sala" back="/clinica/salas" />

      {/* Progress bar */}
      <div className="px-4 pt-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full transition-colors ${n <= passo ? "bg-brand-500" : "bg-gray-200"}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Passo {passo} de 3</p>
      </div>

      {/* Passo 1: Informações básicas */}
      {passo === 1 && (
        <div className="px-4 pt-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Informações da Sala</h2>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nome da sala *</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="ex: Consultório A"
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Tipo de sala *</label>
            <div className="space-y-2">
              {tipoOpcoes.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTipo(t.key)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
                    tipo === t.key ? "border-brand-500 bg-brand-50" : "border-gray-100 bg-white"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{t.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                  </div>
                  {tipo === t.key && <Check size={16} strokeWidth={2.5} className="ml-auto text-brand-500" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Preço por hora (AOA) *</label>
            <input
              type="number"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="ex: 5000"
              min={1000}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-brand-500"
            />
            {preco && <p className="text-xs text-gray-400 mt-1">Comissão MedFreela (15%): {Math.round(Number(preco) * 0.15).toLocaleString()} AOA já incluída</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Zona *</label>
            <div className="flex flex-wrap gap-2">
              {zonaOpcoes.map((z) => (
                <button
                  key={z}
                  onClick={() => setZona(z)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${
                    zona === z ? "border-brand-500 bg-brand-50 text-brand-600" : "border-gray-200 bg-white text-gray-600"
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!passo1Valido}
            onClick={() => setPasso(2)}
            className="w-full bg-brand-500 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl transition-colors inline-flex items-center justify-center gap-1"
          >
            Continuar <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Passo 2: Equipamentos */}
      {passo === 2 && (
        <div className="px-4 pt-6 space-y-5 pb-8">
          <h2 className="text-lg font-bold text-gray-900">Equipamentos Disponíveis</h2>
          <p className="text-sm text-gray-500">Selecione os equipamentos que a sala oferece. Isto ajuda os profissionais a encontrar a sala certa.</p>

          <div className="space-y-2">
            {equipamentosOpcoes.map((e) => (
              <button
                key={e.key}
                onClick={() => toggleEquip(e.key)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-colors ${
                  equip[e.key] ? "border-success-500 bg-success-50" : "border-gray-100 bg-white"
                }`}
              >
                <span className="text-lg">{equip[e.key] ? <CheckSquare size={18} strokeWidth={2} /> : <Square size={18} strokeWidth={2} />}</span>
                <span className={`text-sm font-semibold ${equip[e.key] ? "text-success-700" : "text-gray-700"}`}>{e.label}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400">{equipCount} equipamento(s) selecionado(s)</p>
          <div className="flex gap-3">
            <button onClick={() => setPasso(1)} className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3.5 rounded-2xl inline-flex items-center justify-center gap-1">
              <ChevronLeft size={16} strokeWidth={2} /> Voltar
            </button>
            <button onClick={() => setPasso(3)} className="flex-1 bg-brand-500 text-white font-bold py-3.5 rounded-2xl inline-flex items-center justify-center gap-1">
              Continuar <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* Passo 3: Descrição + confirmar */}
      {passo === 3 && (
        <div className="px-4 pt-6 space-y-5 pb-8">
          <h2 className="text-lg font-bold text-gray-900">Descrição & Confirmação</h2>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Descrição da sala (opcional)</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              placeholder="Descreva o espaço, acesso, parking, regras de utilização..."
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* Resumo */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Resumo</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Nome</span>
              <span className="font-semibold text-gray-900">{nome}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tipo</span>
              <span className="font-semibold text-gray-900">{tipoOpcoes.find((t) => t.key === tipo)?.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Zona</span>
              <span className="font-semibold text-gray-900">{zona}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Preço / hora</span>
              <span className="font-bold text-brand-600">{Number(preco).toLocaleString()} AOA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Equipamentos</span>
              <span className="font-semibold text-gray-900">{equipCount} itens</span>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs text-purple-700">
            <p className="font-bold mb-1 inline-flex items-center gap-1"><Info size={13} strokeWidth={2} /> Como funciona</p>
            <p>A sua sala ficará visível na pesquisa de profissionais. Receberá {Math.round(Number(preco) * 0.85).toLocaleString()} AOA por hora (após comissão MedFreela de 15%).</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPasso(2)} className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3.5 rounded-2xl inline-flex items-center justify-center gap-1">
              <ChevronLeft size={16} strokeWidth={2} /> Voltar
            </button>
            <button onClick={() => setDone(true)} className="flex-1 bg-success-500 text-white font-bold py-3.5 rounded-2xl inline-flex items-center justify-center gap-1">
              <Check size={16} strokeWidth={2.5} /> PUBLICAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
