"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound, Eye, EyeOff, CheckCircle, XCircle, ChevronLeft } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || token.length !== 64) {
      setError("Link inválido ou expirado. Solicite um novo link de recuperação.");
    }
  }, [token]);

  const passwordOk = password.length >= 8;
  const passwordsMatch = password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordOk || !passwordsMatch) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Ocorreu um erro. Tente novamente.");
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Erro de ligação. Verifique a sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={40} strokeWidth={1.5} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Password actualizada!</h2>
        <p className="text-gray-500 mt-2 text-sm leading-6 max-w-xs">
          A sua password foi alterada com sucesso.<br />
          Será redirecionado para o login em breve.
        </p>
        <Link
          href="/login"
          className="mt-5 bg-[#0B3C74] text-white font-bold py-3 px-8 rounded-2xl text-sm"
        >
          Entrar agora
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8fa]">
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <Link href="/login" className="text-gray-500">
          <ChevronLeft size={18} strokeWidth={2} />
        </Link>
        <h1 className="font-bold text-gray-900">Nova Password</h1>
      </div>

      <div className="flex-1 px-5 pt-10 max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <KeyRound size={30} strokeWidth={1.75} className="text-[#0B3C74]" />
          </div>
          <p className="text-sm text-gray-500 leading-6">
            Defina uma nova password segura para a sua conta.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-2">
            <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!error && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                Nova password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#0B3C74] bg-white pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && (
                <p className={`text-xs mt-1 ${passwordOk ? "text-green-600" : "text-red-500"}`}>
                  {passwordOk ? "✓ Tamanho adequado" : "Mínimo 8 caracteres"}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                Confirmar password
              </label>
              <input
                type={showPass ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a password"
                autoComplete="new-password"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#0B3C74] bg-white"
              />
              {confirm.length > 0 && (
                <p className={`text-xs mt-1 ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                  {passwordsMatch ? "✓ Passwords coincidem" : "As passwords não coincidem"}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!passwordOk || !passwordsMatch || loading}
              className="w-full bg-[#0B3C74] disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl transition-colors text-base mt-2"
            >
              {loading ? "A guardar..." : "Guardar nova password"}
            </button>
          </form>
        )}

        {error && (
          <Link
            href="/login/recuperar"
            className="mt-6 block text-center text-[#0B3C74] font-semibold text-sm"
          >
            Solicitar novo link de recuperação
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
