"use client";
import { useState } from "react";
import { TopBar } from "@/components/nav";
import { useRouter } from "next/navigation";

type TipoNotif =
  | "CANDIDATURA_RECEBIDA"
  | "TURNO_HOJE"
  | "RESERVA_SALA"
  | "AVALIACAO_RECEBIDA"
  | "PAGAMENTO_PENDENTE"
  | "PROFISSIONAL_VERIFICADO";

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
    id: "nc-001",
    tipo: "CANDIDATURA_RECEBIDA",
    titulo: "Nova Candidatura Recebida",
    corpo: "Dr. João Silva candidatou-se ao turno de Medicina Geral de 26/04. Analise o perfil e decida.",
    href: "/clinica/plantoes/plt-001",
    lida: false,
    criadoEm: "2026-04-24T08:45:00",
  },
  {
    id: "nc-002",
    tipo: "RESERVA_SALA",
    titulo: "Nova Reserva de Sala",
    corpo: "O Consultório A foi reservado para 26/04 às 09:00 (4h). Código: MF-2026-0042. Receberá 17.000 AOA.",
    href: "/clinica/salas/sala-001",
    lida: false,
    criadoEm: "2026-04-23T10:15:00",
  },
  {
    id: "nc-003",
    tipo: "TURNO_HOJE",
    titulo: "Turno a decorrer hoje",
    corpo: "Turno de Pediatria começa hoje às 14:00 com Enf.ª Maria Costa. Certifique-se que a sala está preparada.",
    href: "/clinica/plantoes",
    lida: true,
    criadoEm: "2026-04-24T07:00:00",
  },
  {
    id: "nc-004",
    tipo: "PAGAMENTO_PENDENTE",
    titulo: "Pagamento Pendente",
    corpo: "O turno de 20/04 com Dr.ª Ana Ferreira ainda não foi pago. Regularize para manter o acesso à plataforma.",
    href: "/clinica/faturacao",
    lida: true,
    criadoEm: "2026-04-21T09:00:00",
  },
  {
    id: "nc-005",
    tipo: "AVALIACAO_RECEBIDA",
    titulo: "Avaliação da Clínica ⭐⭐⭐⭐",
    corpo: "Dr. João Silva avaliou a experiência na vossa clínica com 4 estrelas: «Bom ambiente, organização a melhorar.»",
    href: "/clinica",
    lida: true,
    criadoEm: "2026-04-20T17:00:00",
  },
  {
    id: "nc-006",
    tipo: "PROFISSIONAL_VERIFICADO",
    titulo: "Candidato Verificado",
    corpo: "Dr.ª Luísa Mbinda acaba de receber o badge VERIFICADO SINOME. O seu perfil está disponível para contratação.",
    lida: true,
    criadoEm: "2026-04-18T14:30:00",
  },
];

const iconeMap: Record<TipoNotif, string> = {
  CANDIDATURA_RECEBIDA: "👨‍⚕️",
  TURNO_HOJE: "🗓",
  RESERVA_SALA: "🏥",
  AVALIACAO_RECEBIDA: "⭐",
  PAGAMENTO_PENDENTE: "💳",
  PROFISSIONAL_VERIFICADO: "✅",
};

const corMap: Record<TipoNotif, string> = {
  CANDIDATURA_RECEBIDA: "bg-brand-50",
  TURNO_HOJE: "bg-blue-50",
  RESERVA_SALA: "bg-purple-50",
  AVALIACAO_RECEBIDA: "bg-yellow-50",
  PAGAMENTO_PENDENTE: "bg-red-50",
  PROFISSIONAL_VERIFICADO: "bg-green-50",
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

export default function NotificacoesClinica() {
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
        back="/clinica"
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
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${n.lida ? "bg-gray-100" : "bg-white/70"}`}>
                {iconeMap[n.tipo]}
              </div>
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
