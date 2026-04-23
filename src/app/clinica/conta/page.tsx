import { clinicaLogada } from "@/lib/mock-data";
import { TopBar } from "@/components/nav";
import Link from "next/link";

export default function ContaClinica() {
  const c = clinicaLogada;

  const docs = [
    { label: "Alvará de Funcionamento", estado: "APROVADO" },
    { label: "Licença do MINSA", estado: "APROVADO" },
    { label: "NIF da Clínica", estado: "APROVADO" },
  ];

  return (
    <div>
      <TopBar titulo="A minha Conta" />

      {/* Header */}
      <div className="bg-white px-4 py-6 flex flex-col items-center border-b border-gray-100">
        <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-4xl font-bold text-[#1A6FBB] mb-3">
          {c.nome.charAt(0)}
        </div>
        <h1 className="text-xl font-bold text-gray-900 text-center">{c.nome}</h1>
        {c.verified && (
          <span className="mt-1.5 inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
            ✓ CLÍNICA VERIFICADA
          </span>
        )}
        <div className="flex items-center gap-1 mt-2">
          <span className="text-yellow-400">⭐</span>
          <span className="text-sm font-semibold text-gray-800">{c.rating}</span>
          <span className="text-gray-400 text-xs">({c.totalAvaliacoes} avaliações)</span>
        </div>
      </div>

      {/* Informações */}
      <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Informações</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>🏥 {c.nome}</p>
          <p>📍 {c.morada}, {c.cidade}</p>
          <p>🗺️ {c.provincia}, Angola</p>
        </div>
      </div>

      {/* Documentos */}
      <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Documentos Verificados</h3>
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.label} className="flex items-center gap-2.5 text-sm">
              <span className="text-[#27AE60]">✅</span>
              <span className="text-gray-800">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plano */}
      <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Plano Actual</h3>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-[#1A6FBB]">Plano Gratuito</p>
            <p className="text-xs text-gray-500 mt-0.5">Comissão de 10% por plantão</p>
          </div>
          <button className="bg-[#1A6FBB] text-white text-xs font-bold px-4 py-2 rounded-xl">
            UPGRADE
          </button>
        </div>
      </div>

      {/* Ações */}
      <div className="px-4 py-4 space-y-2">
        <button className="w-full border border-[#1A6FBB] text-[#1A6FBB] font-semibold py-3 rounded-2xl text-sm">
          Editar Perfil da Clínica
        </button>
        <Link href="/" className="block w-full text-center text-red-500 font-semibold py-3 text-sm">
          Terminar Sessão
        </Link>
      </div>
    </div>
  );
}
