"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DoorOpen, Users, CreditCard, PlusCircle,
  ChevronRight, CheckCircle, ArrowRight,
} from "lucide-react";

const passos = [
  {
    icon: <DoorOpen size={40} strokeWidth={1.5} className="text-white" />,
    cor: "from-[#0B3C74] to-[#1a5fba]",
    titulo: "Bem-vindo ao MedFreela!",
    subtitulo: "Rentabilize as suas salas e consultórios",
    descricao:
      "Liste as suas salas para aluguer, defina preços por hora e receba reservas de médicos e outros profissionais de saúde.",
    itens: [
      "Publicação rápida de salas disponíveis",
      "Reservas online com pagamento seguro",
      "Gestão de disponibilidade em tempo real",
    ],
  },
  {
    icon: <Users size={40} strokeWidth={1.5} className="text-white" />,
    cor: "from-[#00A99D] to-[#007f7a]",
    titulo: "Quem reserva as suas salas?",
    subtitulo: "Profissionais verificados pela plataforma",
    descricao:
      "Apenas médicos e profissionais de saúde com perfil verificado podem reservar as suas salas. Tranquilidade garantida.",
    itens: [
      "Médicos especialistas e clínicos gerais",
      "Todos os profissionais têm identidade verificada",
      "Sistema de avaliações após cada reserva",
    ],
  },
  {
    icon: <CreditCard size={40} strokeWidth={1.5} className="text-white" />,
    cor: "from-[#7C3AED] to-[#5b21b6]",
    titulo: "Receba sem complicações",
    subtitulo: "Multicaixa, TPA ou transferência bancária",
    descricao:
      "Os pagamentos são processados de forma segura. Acompanhe todos os rendimentos e histórico de reservas no painel de faturação.",
    itens: [
      "Pagamento processado antes da reserva",
      "Relatório mensal de rendimentos",
      "Recibos automáticos para o locatário",
    ],
  },
  {
    icon: <PlusCircle size={40} strokeWidth={1.5} className="text-white" />,
    cor: "from-[#0B3C74] to-[#00A99D]",
    titulo: "Adicione a sua primeira sala",
    subtitulo: "Leva menos de 2 minutos",
    descricao:
      "Preencha os dados da sala (tipo, equipamentos, preço por hora), publique e comece a receber reservas de imediato.",
    itens: [
      "Consultório, sala de exames, bloco operatório…",
      "Defina o preço por hora livremente",
      "Ative ou desative a disponibilidade quando quiser",
    ],
  },
];

export default function BoasVindasConsultorio() {
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
              onClick={() => router.push("/consultorio/salas/nova")}
              className="w-full bg-[#0B3C74] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2"
            >
              Adicionar primeira sala <ArrowRight size={16} strokeWidth={2} />
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
                onClick={() => router.push("/consultorio")}
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
