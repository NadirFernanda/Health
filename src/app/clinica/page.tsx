import { getAuthSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { PlantaoCard } from "@/components/plantao-card";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, User, MapPin, BadgeCheck } from "lucide-react";

function formatAOA(v: number) {
  return new Intl.NumberFormat("pt-AO").format(v) + " AOA";
}

export default async function ClinicaDashboard() {
  const session = await getAuthSession();
  if (!session || session.role !== "CLINICA") redirect("/login");

  const clinica = await prisma.clinica.findUnique({ where: { userId: session.id } });
  if (!clinica) redirect("/login");

  const plantoes = await prisma.plantao.findMany({
    where: { clinicaId: clinica.id, estado: "ABERTO" },
    include: { clinica: true, _count: { select: { candidaturas: true } } },
    orderBy: { dataInicio: "asc" },
    take: 5,
  });

  const totalPago = plantoes.reduce((s, p) => s + p.valorKwanzas, 0);

  // Map to Plantao shape expected by PlantaoCard
  const plantoesCard = plantoes
    .filter((p) => p.clinica !== null)
    .map((p) => ({
    id: p.id,
    clinica: {
      id: p.clinica!.id,
      nome: p.clinica!.nome,
      morada: p.clinica!.morada ?? "",
      cidade: p.clinica!.cidade ?? "",
      provincia: p.clinica!.provincia,
      logo: p.clinica!.logo ?? "",
      rating: p.clinica!.rating,
      totalAvaliacoes: p.clinica!.totalAvaliacoes,
      verified: p.clinica!.verified,
    },
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
      <div className="bg-gradient-to-br from-[#1A6FBB] to-[#0D4F8A] px-5 pt-10 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-blue-200 text-sm">Painel da Clínica</p>
            <h1 className="text-white font-bold text-xl">{clinica.nome}</h1>
            <p className="text-blue-200 text-xs mt-0.5 flex items-center gap-1">
              <MapPin size={11} strokeWidth={1.75} />
              {clinica.cidade}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/clinica/notificacoes" className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Bell size={18} strokeWidth={1.75} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">2</span>
            </Link>
            <Link href="/clinica/conta" className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
              <User size={18} strokeWidth={1.75} />
            </Link>
          </div>
        </div>
        {clinica.verified && (
          <span className="inline-flex items-center gap-1 bg-[#27AE60]/30 text-green-200 text-xs font-semibold px-2.5 py-1 rounded-full mt-2">
            <BadgeCheck size={13} strokeWidth={2} /> Clínica Verificada
          </span>
        )}

        {/* Resumo mês */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-blue-200 text-xs">Plantões abertos</p>
            <p className="text-white text-2xl font-bold mt-0.5">{plantoes.length}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <p className="text-blue-200 text-xs">Total em aberto</p>
            <p className="text-white text-2xl font-bold mt-0.5">{formatAOA(totalPago)}</p>
          </div>
        </div>
      </div>

      {/* Publicar novo */}
      <div className="px-4 pt-5">
        <Link
          href="/clinica/publicar"
          className="flex items-center justify-center gap-2 bg-[#27AE60] hover:bg-[#1A7A42] text-white font-bold py-4 rounded-2xl transition-colors w-full"
        >
          <span className="text-xl">+</span> PUBLICAR NOVO PLANTÃO
        </Link>
      </div>

      {/* Plantões ativos */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Plantões Ativos</h2>
          <Link href="/clinica/plantoes" className="text-xs text-[#1A6FBB] font-semibold">Ver todos</Link>
        </div>
        <div className="space-y-3">
          {plantoesCard.map((p) => (
            <PlantaoCard
              key={p.id}
              plantao={p}
              basePath="/clinica/plantoes"
              showCandidatarBtn={false}
              showCandidatos
            />
          ))}
        </div>
      </div>
    </div>
  );
}

