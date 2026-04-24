import { prisma } from "@/lib/db";
import { TopBar } from "@/components/nav";
import Link from "next/link";
import { notFound } from "next/navigation";

function formatAOA(v: number) { return new Intl.NumberFormat("pt-AO").format(v) + " AOA"; }
function formatData(d: Date) { return d.toLocaleDateString("pt-AO", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }); }
function formatHora(d: Date) { return d.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" }); }
function calcularDuracao(inicio: Date, fim: Date) {
  const h = Math.round((fim.getTime() - inicio.getTime()) / 3600000);
  return `${h}h`;
}

export default async function DetalhePlantao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plantao = await prisma.plantao.findUnique({
    where: { id },
    include: { clinica: true },
  });
  if (!plantao) return notFound();

  const { clinica, especialidade, dataInicio, dataFim, valorKwanzas, vagas, vagasPreenchidas, descricao } = plantao;

  const equipList = [
    { label: "Maca de exame", ok: plantao.maca },
    { label: "Estetoscópio", ok: plantao.estetoscopio },
    { label: "Tensiômetro", ok: plantao.tensiometro },
    { label: "Termómetro", ok: plantao.termometro },
    { label: "Computador", ok: plantao.computador },
    { label: "Materiais básicos", ok: plantao.materiaisBasicos },
    { label: "Nebulizador", ok: plantao.nebulizador },
    { label: "Oxímetro", ok: plantao.oximetro },
    { label: "Glucómetro", ok: plantao.glucometro },
    { label: "Desfibrilador", ok: plantao.desfibrilador },
  ];

  return (
    <div>
      <TopBar titulo="Detalhe do Plantão" back="/medico/buscar" />

      {/* Header clínica */}
      <div className="bg-white px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl font-bold text-[#1A6FBB]">
            {clinica.nome.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-gray-900 text-base">{clinica.nome}</h2>
              {clinica.verified && <span className="text-[#27AE60] text-sm font-bold">✓</span>}
            </div>
            <p className="text-gray-500 text-sm">📍 {clinica.cidade}, {clinica.provincia}</p>
            <p className="text-yellow-500 text-xs mt-0.5">⭐ {clinica.rating} ({clinica.totalAvaliacoes} avaliações)</p>
          </div>
        </div>
      </div>

      {/* Dados */}
      <div className="bg-white mt-2 px-4 py-4 space-y-2.5 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Dados do Plantão</h3>
        {[
          { icon: "🩺", label: especialidade },
          { icon: "📅", label: formatData(dataInicio) },
          { icon: "⏰", label: `${formatHora(dataInicio)} – ${formatHora(dataFim)} (${calcularDuracao(dataInicio, dataFim)})` },
          { icon: "💵", label: formatAOA(valorKwanzas), bold: true },
          { icon: "👥", label: `${vagas - vagasPreenchidas} vaga(s) disponível(eis)` },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="text-lg w-6 text-center">{item.icon}</span>
            <span className={item.bold ? "font-bold text-[#1A6FBB] text-base" : "text-gray-800"}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Equipamentos */}
      <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Equipamentos Disponíveis</h3>
        <div className="space-y-2">
          {equipList.map((e) => (
            <div key={e.label} className="flex items-center gap-2.5 text-sm">
              <span className={e.ok ? "text-[#27AE60]" : "text-red-400"}>
                {e.ok ? "✅" : "❌"}
              </span>
              <span className={e.ok ? "text-gray-800" : "text-gray-400 line-through"}>{e.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Descrição */}
      {descricao && (
        <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Descrição</h3>
          <p className="text-sm text-gray-700 leading-6">{descricao}</p>
        </div>
      )}

      {/* CTA */}
      <div className="px-4 py-6">
        <Link
          href={`/medico/plantoes/${plantao.id}/confirmar`}
          className="block w-full text-center bg-[#1A6FBB] hover:bg-[#0D4F8A] text-white font-bold py-4 rounded-2xl transition-colors text-base"
        >
          CANDIDATAR-ME
        </Link>
        <p className="text-center text-xs text-gray-400 mt-2">
          ⚠️ Só médicos com perfil verificado podem candidatar-se
        </p>
      </div>
    </div>
  );
}
