import { getAuthSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { PlantaoCard } from "@/components/plantao-card";
import Link from "next/link";
import { Bell, User, BadgeCheck, Clock, XCircle, AlertCircle, HeadphonesIcon, Shuffle, CalendarDays } from "lucide-react";
import DisponibilidadeToggle from "./disponivel-toggle";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

export default async function MedicoDashboard() {
  const session = await getAuthSession();
  if (!session || session.role !== "MEDICO") redirect("/login");

  const prof = await getProfissionalFromSession(session);
  if (!prof) redirect("/login");

  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [plantoes, ganhos] = await Promise.all([
    prisma.plantao.findMany({
      where: {
        estado: "ABERTO",
        OR: [{ profissionalPublicadorId: null }, { profissionalPublicadorId: { not: prof.id } }],
      },
      select: {
        id: true, tipoProfissional: true, especialidade: true,
        dataInicio: true, dataFim: true, valorKwanzas: true,
        vagas: true, vagasPreenchidas: true, estado: true, descricao: true,
        publicadoPorMedico: true,
        maca: true, estetoscopio: true, tensiometro: true, termometro: true,
        computador: true, materiaisBasicos: true, nebulizador: true,
        oximetro: true, glucometro: true, desfibrilador: true,
        clinica: {
          select: { id: true, nome: true, morada: true, cidade: true, provincia: true, logo: true, rating: true, totalAvaliacoes: true, verified: true },
        },
        profissionalPublicador: {
          select: { id: true, nome: true, especialidade: true, rating: true, verified: true },
        },
        _count: { select: { candidaturas: true } },
      },
      orderBy: { dataInicio: "asc" },
      take: 5,
    }),
    prisma.transacaoCarteira.aggregate({
      where: { profissionalId: prof.id, tipo: "CREDITO", estado: "PROCESSADO", criadoEm: { gte: inicioMes } },
      _sum: { valorCentavos: true },
    }),
  ]);

  const ganhosMesAoa = Math.round(Number(ganhos._sum.valorCentavos ?? 0n) / 100);

  const plantoesCard = plantoes.map((p) => ({
    id: p.id,
    publicadoPorMedico: p.publicadoPorMedico,
    clinica: p.clinica
      ? { id: p.clinica.id, nome: p.clinica.nome, morada: p.clinica.morada ?? "", cidade: p.clinica.cidade ?? "", provincia: p.clinica.provincia, logo: p.clinica.logo ?? "", rating: p.clinica.rating, totalAvaliacoes: p.clinica.totalAvaliacoes, verified: p.clinica.verified }
      : null,
    profissionalPublicador: p.profissionalPublicador ?? null,
    tipoProfissional: p.tipoProfissional,
    especialidade: p.especialidade as never,
    dataInicio: p.dataInicio.toISOString(),
    dataFim: p.dataFim.toISOString(),
    valorKwanzas: p.valorKwanzas,
    vagas: p.vagas,
    vagasPreenchidas: p.vagasPreenchidas,
    estado: p.estado as never,
    descricao: p.descricao ?? "",
    candidatos: p._count.candidaturas,
    equipamentos: {
      maca: p.maca, estetoscopio: p.estetoscopio, tensiometro: p.tensiometro,
      termometro: p.termometro, computador: p.computador, materiaisBasicos: p.materiaisBasicos,
      nebulizador: p.nebulizador, oximetro: p.oximetro, glucometro: p.glucometro, desfibrilador: p.desfibrilador,
    },
  }));

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] px-5 pt-6 pb-6">
        <div className="flex justify-center mb-4">
          <div className="bg-white rounded-xl px-4 py-2 shadow-lg shadow-black/20">
            <img src="/Imagens/LOGO_MED_FREELA.png" alt="MedFreela" className="object-contain h-11 w-auto" />
          </div>
        </div>
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-blue-200 text-sm">Olá,</p>
            <h1 className="text-white font-bold text-xl">{prof.nome}</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/medico/notificacoes" className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Bell size={18} strokeWidth={1.75} />
            </Link>
            <Link href="/medico/perfil" className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
              <User size={18} strokeWidth={1.75} />
            </Link>
          </div>
        </div>

        {prof.estadoVerificacao === "APROVADO" && (
          <span className="inline-flex items-center gap-1 bg-[#00A99D]/30 text-green-200 text-xs font-semibold px-2.5 py-1 rounded-full mt-2">
            <BadgeCheck size={13} strokeWidth={2} /> Perfil Verificado
          </span>
        )}
        {prof.estadoVerificacao === "EM_ANALISE" && (
          <span className="inline-flex items-center gap-1 bg-yellow-400/20 text-yellow-200 text-xs font-semibold px-2.5 py-1 rounded-full mt-2">
            <Clock size={13} strokeWidth={2} /> Em Verificação
          </span>
        )}
        {prof.estadoVerificacao === "REJEITADO" && (
          <span className="inline-flex items-center gap-1 bg-red-400/20 text-red-300 text-xs font-semibold px-2.5 py-1 rounded-full mt-2">
            <XCircle size={13} strokeWidth={2} /> Verificação Recusada
          </span>
        )}
        {prof.estadoVerificacao === "PENDENTE" && (
          <span className="inline-flex items-center gap-1 bg-white/10 text-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full mt-2">
            <AlertCircle size={13} strokeWidth={2} /> Perfil por verificar
          </span>
        )}

        <DisponibilidadeToggle inicial={prof.disponivelAgora} />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-blue-200 text-xs">Plantões feitos</p>
            <p className="text-white text-2xl font-bold mt-0.5">{prof.totalPlantoes}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-blue-200 text-xs">Ganhos este mês</p>
            <p className="text-white text-2xl font-bold mt-0.5">{formatAOA(ganhosMesAoa)}</p>
          </div>
        </div>
      </div>

      {/* Acções rápidas */}
      <div className="px-4 pt-4 space-y-2">
        <Link href="/medico/candidaturas" className="flex items-center justify-between bg-[#0B3C74]/5 border border-[#0B3C74]/20 rounded-2xl px-4 py-3.5 active:opacity-80 transition-opacity">
          <div>
            <p className="font-bold text-sm text-[#0B3C74]">As minhas candidaturas</p>
            <p className="text-xs text-[#0B3C74]/70 mt-0.5">Ver todos os plantões aos quais te candidataste →</p>
          </div>
        </Link>
        <Link href="/medico/publicar-plantao" className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3.5 active:opacity-80 transition-opacity">
          <div>
            <p className="font-bold text-sm text-[#0B3C74]">Tens um plantão que não podes fazer?</p>
            <p className="text-xs text-[#00A99D] mt-0.5">Publica a vaga e paga um substituto →</p>
          </div>
        </Link>
        <Link href="/medico/plantoes" className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3.5 active:opacity-80 transition-opacity">
          <div>
            <p className="font-bold text-sm text-blue-800">Os meus plantões publicados</p>
            <p className="text-xs text-blue-600 mt-0.5">Ver vagas que publicaste e as candidaturas →</p>
          </div>
        </Link>
        <Link href="/medico/minhas-reservas" className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3.5 active:opacity-80 transition-opacity">
          <div>
            <p className="font-bold text-sm text-teal-800">Minhas Reservas de Salas</p>
            <p className="text-xs text-teal-600 mt-0.5">Ver e gerir as tuas reservas de consultórios →</p>
          </div>
        </Link>
        <Link href="/medico/agenda" className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3.5 active:opacity-80 transition-opacity">
          <CalendarDays size={18} strokeWidth={1.75} className="text-indigo-600 shrink-0" />
          <div>
            <p className="font-bold text-sm text-indigo-800">Agenda</p>
            <p className="text-xs text-indigo-500 mt-0.5">Ver os teus plantões e reservas num calendário →</p>
          </div>
        </Link>
        <Link href="/medico/matching" className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3.5 active:opacity-80 transition-opacity">
          <Shuffle size={18} strokeWidth={1.75} className="text-purple-600 shrink-0" />
          <div>
            <p className="font-bold text-sm text-purple-800">Matching direto</p>
            <p className="text-xs text-purple-500 mt-0.5">Convida um colega substituto ou reserva uma sala específica →</p>
          </div>
        </Link>
        <Link href="/support" className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 active:opacity-80 transition-opacity">
          <HeadphonesIcon size={18} strokeWidth={1.75} className="text-gray-500 shrink-0" />
          <div>
            <p className="font-bold text-sm text-gray-700">Suporte</p>
            <p className="text-xs text-gray-500 mt-0.5">Abre um ticket para a nossa equipa de suporte →</p>
          </div>
        </Link>
      </div>

      {/* Plantões disponíveis */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Plantões para si</h2>
          <Link href="/medico/buscar" className="text-xs text-[#0B3C74] font-semibold">Ver todos</Link>
        </div>
        <div className="space-y-3">
          {plantoesCard.map((p) => (
            <PlantaoCard key={p.id} plantao={p as never} showCandidatarBtn />
          ))}
        </div>
      </div>
    </div>
  );
}
