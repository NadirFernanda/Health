import Link from "next/link";
import { cookies } from "next/headers";
import { decodeToken, COOKIE_NAME } from "@/lib/auth";
import {
  Stethoscope, Building2, BadgeCheck, Banknote, BedDouble, ChevronRight, LogOut, DoorOpen,
} from "lucide-react";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeToken(token);
}

export default async function Home() {
  const session = await getSession();

  const dashboards: Record<string, string> = {
    ADMIN: "/admin",
    MEDICO: "/medico",
    CLINICA: "/clinica",
    PROPRIETARIO_SALA: "/consultorio",
  };

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrador",
    MEDICO: "Médico",
    CLINICA: "Clínica",
    PROPRIETARIO_SALA: "Proprietário de Consultório",
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#00A99D] px-6 pt-14 pb-10 flex flex-col items-center text-center">
        <div className="bg-white rounded-2xl px-6 py-4 shadow-2xl shadow-black/25 mb-4">
          <img
            src="/Imagens/LOGO_MED_FREELA.png"
            alt="MedFreela"
            className="object-contain h-20 w-auto"
          />
        </div>
        <p className="text-blue-100 text-sm leading-6 max-w-xs">
          A plataforma que transforma profissionais
          disponíveis e consultórios vazios em
          serviços de saúde activos.
        </p>
      </div>

      {/* Stats */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-[#0B3C74]">41</p>
          <p className="text-xs text-gray-500 mt-0.5">Turnos realizados</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#00A99D]">20+</p>
          <p className="text-xs text-gray-500 mt-0.5">Profissionais verificados</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#0B3C74]">5</p>
          <p className="text-xs text-gray-500 mt-0.5">Clínicas parceiras</p>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 px-6 py-8 flex flex-col gap-4">

        {session ? (
          /* ── Utilizador já autenticado ── */
          <>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-1">Sessão activa como</p>
              <p className="font-bold text-gray-900 text-base">{session.sub}</p>
              <p className="text-xs text-[#0B3C74] font-semibold mt-0.5">{roleLabels[session.role] ?? session.role}</p>
            </div>

            <Link
              href={dashboards[session.role] ?? "/"}
              className="block bg-[#0B3C74] hover:bg-[#00A99D] text-white rounded-2xl p-5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <ChevronRight size={24} strokeWidth={1.75} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-base">Ir para o meu painel</p>
                  <p className="text-blue-200 text-sm mt-0.5">Continuar como {roleLabels[session.role] ?? session.role}</p>
                </div>
                <ChevronRight size={20} strokeWidth={1.75} className="ml-auto text-blue-200" />
              </div>
            </Link>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 rounded-2xl p-4 transition-colors font-semibold text-sm"
              >
                <LogOut size={16} strokeWidth={2} />
                Sair e trocar de conta
              </button>
            </form>
          </>
        ) : (
          /* ── Sem sessão — escolher papel ── */
          <>
            <p className="text-center text-gray-500 text-sm mb-2">Como quer entrar?</p>

            <Link
              href="/medico"
              className="block bg-[#0B3C74] hover:bg-[#00A99D] text-white rounded-2xl p-5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Stethoscope size={24} strokeWidth={1.75} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-base">Sou Profissional de Saúde</p>
                  <p className="text-blue-200 text-sm mt-0.5">Médico, enfermeiro ou técnico — encontre turnos e receba em segurança</p>
                </div>
                <ChevronRight size={20} strokeWidth={1.75} className="ml-auto text-blue-200" />
              </div>
            </Link>

            <Link
              href="/clinica"
              className="block bg-white border-2 border-[#0B3C74] text-[#0B3C74] rounded-2xl p-5 transition-colors hover:bg-blue-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 size={24} strokeWidth={1.75} className="text-[#0B3C74]" />
                </div>
                <div>
                  <p className="font-bold text-base text-gray-900">Sou Clínica</p>
                  <p className="text-gray-500 text-sm mt-0.5">Publique turnos e contrate profissionais verificados</p>
                </div>
                <ChevronRight size={20} strokeWidth={1.75} className="ml-auto text-[#0B3C74]" />
              </div>
            </Link>

            <Link
              href="/consultorio"
              className="block bg-white border-2 border-[#00A99D] text-[#00A99D] rounded-2xl p-5 transition-colors hover:bg-teal-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                  <DoorOpen size={24} strokeWidth={1.75} className="text-[#00A99D]" />
                </div>
                <div>
                  <p className="font-bold text-base text-gray-900">Sou Proprietário de Consultório</p>
                  <p className="text-gray-500 text-sm mt-0.5">Publique horas vagas e alugue salas por hora</p>
                </div>
                <ChevronRight size={20} strokeWidth={1.75} className="ml-auto text-[#00A99D]" />
              </div>
            </Link>
          </>
        )}

        {/* Diferenciais */}
        <div className="mt-4 space-y-3">
          {[
            { icon: BadgeCheck, title: "Profissionais verificados", desc: "Credenciais validadas via SINOME/OMA antes de cada turno" },
            { icon: Banknote, title: "Pagamento garantido", desc: "Via Multicaixa Express, sem atrasos ou informalidade" },
            { icon: BedDouble, title: "Equipamentos declarados", desc: "Saiba exatamente o que há na sala antes de aceitar" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
              <item.icon size={20} strokeWidth={1.75} className="text-[#0B3C74] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          A operar em Luanda · Centralidade Horizonte
        </p>

        <Link href="/admin" className="block text-center text-xs text-gray-300 hover:text-gray-400 mt-2 pb-2 transition-colors">
          Acesso Administrador
        </Link>
      </div>
    </div>
  );
}
