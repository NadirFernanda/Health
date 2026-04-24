"use client";
import { useState } from "react";
import { TopBar } from "@/components/nav";
import { useRouter } from "next/navigation";

type TipoNotif =
  | "CANDIDATURA_ACEITE"
  | "CANDIDATURA_RECUSADA"
  | "TURNO_AMANHA"
  | "RESERVA_CONFIRMADA"
  | "AVALIACAO_RECEBIDA"
  | "VERIFICACAO_CONCLUIDA"
  | "PAGAMENTO_PROCESSADO";

interface Notificacao {
  id: string;
  tipo: TipoNotif;
  titulo: string;
  corpo: string;
  href?: string;
  lida: boolean;
  criadoEm: string;
}

const notificacoesMock: Notificacao[] = [
  {
    id: "n-001",
    tipo: "CANDIDATURA_ACEITE",
    titulo: "Candidatura Aceite! 🎉",
    corpo: "A Clínica Horizonte aceitou a sua candidatura para o turno de Medicina Geral dia 26/04.",
    href: "/medico/plantoes/plt-001",
    lida: false,
    criadoEm: "2026-04-24T09:30:00",
  },
  {
    id: "n-002",
    tipo: "TURNO_AMANHA",
    titulo: "Lembrete: Turno Amanhã",
    corpo: "Tem um turno marcado para amanhã, 25/04 às 08:00 na Clínica Central. Não se esqueça!",
    href: "/medico/plantoes/plt-002",
    lida: false,
    criadoEm: "2026-04-24T07:00:00",
  },
  {
    id: "n-003",
    tipo: "PAGAMENTO_PROCESSADO",
    titulo: "Pagamento Recebido",
    corpo: "Foi creditado 15.000 AOA na sua carteira referente ao turno de 20/04 na Clínica Saúde+.",
    href: "/medico/ganhos",
    lida: false,
    criadoEm: "2026-04-22T14:00:00",
  },
  {
    id: "n-004",
    tipo: "RESERVA_CONFIRMADA",
    titulo: "Reserva de Sala Confirmada",
    corpo: "A sua reserva do Consultório A (Clínica Horizonte) para 26/04 às 09:00 foi confirmada. Código: MF-2026-0042",
    href: "/medico/minhas-reservas",
    lida: true,
    criadoEm: "2026-04-23T10:15:00",
  },
  {
    id: "n-005",
    tipo: "AVALIACAO_RECEBIDA",
    titulo: "Nova Avaliação ⭐⭐⭐⭐⭐",
    corpo: "A Clínica Horizonte avaliou o seu desempenho com 5 estrelas: «Excelente profissional, pontual e muito atencioso.»",
    href: "/medico/perfil",
    lida: true,
    criadoEm: "2026-04-21T16:30:00",
  },
  {
    id: "n-006",
    tipo: "CANDIDATURA_RECUSADA",
    titulo: "Candidatura não seleccionada",
    corpo: "A Clínica Santa Maria não seleccionou a sua candidatura para o turno de Pediatria de 18/04. Continue a candidatar-se!",
    lida: true,
    criadoEm: "2026-04-18T11:00:00",
  },
  {
    id: "n-007",
    tipo: "VERIFICACAO_CONCLUIDA",
    titulo: "Perfil Verificado ✓",
    corpo: "A sua Verificação Express foi concluída com sucesso. Já pode candidatar-se a todos os plantões disponíveis.",
    href: "/medico/perfil",
    lida: true,
    criadoEm: "2026-04-10T09:00:00",
  },
];

const iconeMap: Record<TipoNotif, string> = {
  CANDIDATURA_ACEITE: "✅",
  CANDIDATURA_RECUSADA: "❌",
  TURNO_AMANHA: "🗓",
  RESERVA_CONFIRMADA: "🏥",
  AVALIACAO_RECEBIDA: "⭐",
  VERIFICACAO_CONCLUIDA: "🔓",
  PAGAMENTO_PROCESSADO: "💰",
};

const corMap: Record<TipoNotif, string> = {
  CANDIDATURA_ACEITE: "bg-green-50",
  CANDIDATURA_RECUSADA: "bg-red-50",
  TURNO_AMANHA: "bg-blue-50",
  RESERVA_CONFIRMADA: "bg-purple-50",
  AVALIACAO_RECEBIDA: "bg-yellow-50",
  VERIFICACAO_CONCLUIDA: "bg-brand-50",
  PAGAMENTO_PROCESSADO: "bg-emerald-50",
};

function tempoRelativo(iso: string): string {
  const agora = new Date();
  const dt = new Date(iso);
  const diffMin = Math.floor((agora.getTime() - dt.getTime()) / 60000);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD} dia(s)`;
}

export default function Notificacoes() {
  const router = useRouter();
  const [lista, setLista] = useState<Notificacao[]>(notificacoesMock);
  const naoLidas = lista.filter((n) => !n.lida).length;

  const marcarTodasLidas = () => setLista((prev) => prev.map((n) => ({ ...n, lida: true })));
  const marcarLida = (id: string) => setLista((prev) => prev.map((n) => n.id === id ? { ...n, lida: true } : n));

  const handleClick = (n: Notificacao) => {
    marcarLida(n.id);
    if (n.href) router.push(n.href);
  };

  return (
    <div>
      <TopBar
        titulo={`Notificações${naoLidas > 0 ? ` (${naoLidas})` : ""}`}
        back="/medico"
        actions={
          naoLidas > 0 ? (
            <button onClick={marcarTodasLidas} className="text-xs text-brand-500 font-semibold">
              Marcar todas lidas
            </button>
          ) : undefined
        }
      />

      <div className="px-4 pt-3 pb-8 space-y-2">
        {lista.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-sm">Sem notificações por enquanto.</p>
          </div>
        ) : (
          lista.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left flex items-start gap-3 p-3.5 rounded-2xl border transition-colors active:opacity-80 ${
                n.lida ? "bg-white border-gray-100" : `${corMap[n.tipo]} border-transparent shadow-sm`
              }`}
            >
              {/* Ícone */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${n.lida ? "bg-gray-100" : "bg-white/70"}`}>
                {iconeMap[n.tipo]}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${n.lida ? "text-gray-700" : "text-gray-900"}`}>{n.titulo}</p>
                  {!n.lida && <span className="w-2 h-2 bg-brand-500 rounded-full shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-5">{n.corpo}</p>
                <p className="text-xs text-gray-400 mt-1">{tempoRelativo(n.criadoEm)}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
