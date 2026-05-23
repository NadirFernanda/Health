"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope, ShieldCheck, Search, CalendarDays,
  ChevronRight, CheckCircle, ArrowRight,
} from "lucide-react";

const passos = [
  {
    icon: <Stethoscope size={40} strokeWidth={1.5} className="text-white" />,
    cor: "from-[#0B3C74] to-[#1a5fba]",
    titulo: "Bem-vindo ao MedFreela!",
    subtitulo: "A plataforma de plantões médicos de Angola",
    descricao:
      "Encontra plantões pagos em clínicas e hospitais, publica vagas para colegas substitutos e gere toda a tua agenda num só lugar.",
    itens: [
      "Plantões em Luanda e outras províncias",
      "Pagamentos seguros e garantidos",
      "Perfis verificados de profissionais",
    ],
  },
  {
    icon: <ShieldCheck size={40} strokeWidth={1.5} className="text-white" />,
    cor: "from-[#00A99D] to-[#007f7a]",
    titulo: "Verifica o teu perfil",
    subtitulo: "Só perfis verificados podem candidatar-se",
    descricao:
      "Para te candidatares a plantões, precisamos de confirmar a tua identidade e credenciais profissionais. O processo demora 24–48h.",
    itens: [
      "Carteira Profissional (OMA/SINOME)",
      "Bilhete de Identidade ou Passaporte",
      "Prazo de análise: 24 a 48 horas",
    ],
  },
  {
    icon: <Search size={40} strokeWidth={1.5} className="text-white" />,
    cor: "from-[#7C3AED] to-[#5b21b6]",
    titulo: "Encontra o teu próximo plantão",
    subtitulo: "Filtra por especialidade, zona e valor",
    descricao:
      "Navega nos plantões disponíveis, candidata-te com um clique e acompanha o estado das tuas candidaturas em tempo real.",
    itens: [
      "Candidatura em 1 clique",
      "Notificações de aceitação/recusa",
      "Histórico de todos os plantões",
    ],
  },
  {
    icon: <CalendarDays size={40} strokeWidth={1.5} className="text-white" />,
    cor: "from-[#0B3C74] to-[#00A99D]",
    titulo: "Agenda sempre atualizada",
    subtitulo: "Plantões e reservas num calendário",
    descricao:
      "Acede à tua agenda para veres todos os plantões confirmados e reservas de salas. Nunca percas um compromisso.",
    itens: [
      "Calendário mensal interativo",
      "Plantões e reservas de sala",
      "Acesso rápido pela barra de navegação",
    ],
  },
];

export default function BoasVindasMedico() {
  const [passo, setPasso] = useState(0);
  const router = useRouter();
  const atual = passos[passo];
  const ultimo = passo === passos.length - 1;

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      {/* Hero colorido */}
      <div className={`bg-gradient-to-br ${atual.cor} px-6 pt-14 pb-14 flex flex-col items-center text-center transition-all duration-300`}>
        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-5 shadow-lg">
          {atual.icon}
        </div>
        <h1 className="text-white font-black text-2xl leading-tight mb-2">{atual.titulo}</h1>
        <p className="text-white/80 text-sm">{atual.subtitulo}</p>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 px-5 -mt-5">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-4">
          <p className="text-gray-600 text-sm leading-6 mb-4">{atual.descricao}</p>
          <div className="space-y-2">
            {atual.itens.map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                <CheckCircle size={16} strokeWidth={2} className="text-[#00A99D] shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Indicadores de passo */}
        <div className="flex justify-center gap-2 mb-5">
          {passos.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === passo ? "w-6 h-2 bg-[#0B3C74]" : "w-2 h-2 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Botões */}
        <div className="space-y-2.5">
          {ultimo ? (
            <button
              onClick={() => router.push("/medico")}
              className="w-full bg-[#0B3C74] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2"
            >
              Começar a usar o MedFreela <ArrowRight size={16} strokeWidth={2} />
            </button>
          ) : (
            <>
              <button
                onClick={() => setPasso((p) => p + 1)}
                className="w-full bg-[#0B3C74] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2"
              >
                Próximo <ChevronRight size={16} strokeWidth={2} />
              </button>
              <button
                onClick={() => router.push("/medico")}
                className="w-full text-gray-400 text-sm py-2 font-medium"
              >
                Saltar introdução
              </button>
            </>
          )}
        </div>

        {passo > 0 && (
          <button
            onClick={() => setPasso((p) => p - 1)}
            className="w-full text-center text-xs text-gray-300 mt-3 py-1"
          >
            ← Passo anterior
          </button>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
