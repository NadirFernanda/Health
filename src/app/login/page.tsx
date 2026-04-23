import LoginForm from "./login-form";

export const metadata = { title: "Login — PLANTO Admin" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  return (
    <div className="min-h-screen bg-[#0D1F3C] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#1A6FBB] rounded-2xl flex items-center justify-center font-black text-white text-3xl mx-auto mb-4 shadow-lg shadow-[#1A6FBB]/30">
            P
          </div>
          <h1 className="text-white font-black text-2xl tracking-tight">PLANTO</h1>
          <p className="text-white/40 text-sm mt-1">Sistema de Gestão de Plantões</p>
        </div>

        <LoginForm searchParams={searchParams} />

        <p className="text-center text-xs text-white/20 mt-8">
          Acesso restrito. Uso exclusivo de administradores autorizados.
        </p>
      </div>
    </div>
  );
}
