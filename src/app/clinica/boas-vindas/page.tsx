"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Users, CreditCard, BadgeCheck,
  ChevronRight, CheckCircle, ArrowRight,
} from "lucide-react";

const passos = [
  {
    icon: <Building2 size={40} strokeWidth={1.5} className="text-white" />,
    cor: "from-[#0B3C74] to-[#1a5fba]",
    titulo: "Bem-vinda ao MedFreela!",
    subtitulo: "A plataforma de gestão de plantões",
    descricao:
      "Publique vagas de plantão, encontre profissionais verificados e gira todos os contratos e pagamentos numa única plataforma.",
    itens: [
      "Publicação rápida de vagas de plantão",
      "Base de médicos e enfermeiros verificados",
      "Contratos e pagamentos automáticos",
    ],
  },
  {
    icon: <Users size={40} strokeWidth={1.5} className="text-white" />,
    cor: "from-[#00A99D] to-[#007f7a]",
    titulo: "Encontre os melhores profissionais",
    subtitulo: "Filtre por especialidade, zona e rating",
    descricao:
      "Aceda à nossa base de profissionais de saúde verificados. Veja perfis, avaliações e histórico de plantões antes de contratar.",
    itens: [
      "Médicos, Enfermeiros e Técnicos de Saúde",
      "Perfis com carteira profissional verificada",
      "Sistema de avaliações e rating",
    ],
  },
  {
    icon: <CreditCard size={40} strokeWidth={1.5} className="text-white" />,
    cor: "from-[#7C3AED] to-[#5b21b6]",
    titulo: "Pagamentos simplificados",
    subtitulo: "Multicaixa Express, TPA ou transferência",
    descricao:
      "Os pagamentos são processados de forma segura pela plataforma. Acompanhe toda a faturação e gere recibos com um clique.",
    itens: [
      "Pagamento seguro via escrow",
      "Libertação automática após o plantão",
      "Relatórios de faturação mensais",
    ],
  },
  {
    icon: <BadgeCheck size={40} strokeWidth={1.5} className="text-white" />,
    cor: "from-[#0B3C74] to-[#00A99D]",
    titulo: "Comece a publicar agora",
    subtitulo: "O seu primeiro plantão em menos de 2 minutos",
    descricao:
      "Preencha os dados da vaga, defina o valor e publique. Os profissionais verificados vão receber notificações e poderão candidatar-se de imediato.",
    itens: [
      "Formulário simples e rápido",
      "Candidatos notificados em tempo real",
      "Aceite o candidato ideal com um clique",
    ],
  },
];

export default function BoasVindasClinica() {
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
              onClick={() => router.push("/clinica/publicar")}
              className="w-full bg-[#0B3C74] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2"
            >
              Publicar primeiro plantão <ArrowRight size={16} strokeWidth={2} />
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
                onClick={() => router.push("/clinica")}
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
