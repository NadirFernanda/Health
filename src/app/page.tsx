import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1A6FBB] to-[#0D4F8A] px-6 pt-16 pb-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-3xl">🩺</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">planto</h1>
        <p className="text-blue-100 mt-2 text-sm font-medium">O teu próximo plantão está aqui.</p>
        <p className="text-blue-200 mt-4 text-sm leading-6 max-w-xs">
          Conectamos médicos verificados a clínicas em Angola. Rápido, seguro e com pagamento garantido.
        </p>
      </div>

      {/* Stats */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-[#1A6FBB]">41</p>
          <p className="text-xs text-gray-500 mt-0.5">Plantões realizados</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#27AE60]">20+</p>
          <p className="text-xs text-gray-500 mt-0.5">Médicos verificados</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#1A6FBB]">5</p>
          <p className="text-xs text-gray-500 mt-0.5">Clínicas parceiras</p>
        </div>
      </div>

      {/* Escolher perfil */}
      <div className="flex-1 px-6 py-8 flex flex-col gap-4">
        <p className="text-center text-gray-500 text-sm mb-2">Como quer entrar?</p>

        <Link
          href="/medico"
          className="block bg-[#1A6FBB] hover:bg-[#0D4F8A] text-white rounded-2xl p-5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl shrink-0">
              🩺
            </div>
            <div>
              <p className="font-bold text-base">Sou Médico</p>
              <p className="text-blue-200 text-sm mt-0.5">Encontre plantões e receba em segurança</p>
            </div>
            <span className="ml-auto text-blue-200 text-lg">→</span>
          </div>
        </Link>

        <Link
          href="/clinica"
          className="block bg-white border-2 border-[#1A6FBB] text-[#1A6FBB] rounded-2xl p-5 transition-colors hover:bg-blue-50"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
              🏥
            </div>
            <div>
              <p className="font-bold text-base text-gray-900">Sou Clínica</p>
              <p className="text-gray-500 text-sm mt-0.5">Publique plantões e encontre médicos verificados</p>
            </div>
            <span className="ml-auto text-[#1A6FBB] text-lg">→</span>
          </div>
        </Link>

        {/* Diferenciais */}
        <div className="mt-4 space-y-3">
          {[
            { icon: "✅", title: "Médicos verificados", desc: "Cédula da Ordem Médica confirmada antes de cada plantão" },
            { icon: "💵", title: "Pagamento garantido", desc: "Via Multicaixa Express, sem atrasos ou informalidade" },
            { icon: "🛏️", title: "Equipamentos declarados", desc: "Saiba exatamente o que há na sala antes de aceitar" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
              <span className="text-xl shrink-0">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Piloto a operar em Huambo · Centralidade Horizonte
        </p>

        <Link href="/admin" className="block text-center text-xs text-gray-300 hover:text-gray-400 mt-2 pb-2 transition-colors">
          Acesso Administrador
        </Link>
      </div>
    </div>
  );
}
