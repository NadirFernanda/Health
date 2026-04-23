import LoginForm from "./login-form";

export const metadata = { title: "Entrar — PlantãoMed" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1F3C] via-[#0D2E5C] to-[#0D4F8A] flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#1A6FBB] rounded-3xl flex items-center justify-center font-black text-white text-4xl mx-auto mb-4 shadow-2xl shadow-[#1A6FBB]/40">
            P
          </div>
          <h1 className="text-white font-black text-3xl tracking-tight">PlantãoMed</h1>
          <p className="text-blue-300/70 text-sm mt-1">Gestão de Plantões Médicos · Angola</p>
        </div>

        {/* Card de login */}
        <div className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-white font-bold text-lg mb-1">Bem-vindo de volta</h2>
          <p className="text-blue-200/60 text-sm mb-6">Entre com o seu e-mail e palavra-passe</p>

          <LoginForm searchParams={searchParams} />
        </div>

        {/* Credenciais de demonstração */}
        <div className="mt-5 bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
            Contas de demonstração
          </p>
          <div className="space-y-2">
            <DemoCredential
              role="Médico"
              icon="🩺"
              email="medico@plantoamed.ao"
              password="med123456"
              color="text-blue-300"
            />
            <DemoCredential
              role="Clínica"
              icon="🏥"
              email="clinica@horizonte.ao"
              password="cli123456"
              color="text-green-300"
            />
            <DemoCredential
              role="Administrador"
              icon="⚙️"
              email="admin@plantoamed.ao"
              password="planto@admin2025"
              color="text-orange-300"
            />
          </div>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          PlantãoMed © 2026 · Huambo, Angola
        </p>
      </div>
    </div>
  );
}

function DemoCredential({
  role,
  icon,
  email,
  password,
  color,
}: {
  role: string;
  icon: string;
  email: string;
  password: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base shrink-0">{icon}</span>
        <span className={`text-xs font-semibold ${color} shrink-0`}>{role}</span>
      </div>
      <div className="text-right min-w-0">
        <p className="text-white/50 text-xs truncate">{email}</p>
        <p className="text-white/30 text-xs font-mono">{password}</p>
      </div>
    </div>
  );
}
