"use client";

import { use, useActionState, useState } from "react";
import { loginAction, LoginState } from "@/app/actions/auth";

export default function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = use(searchParams);
  const redirectTo = params.redirect ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirectTo} />

      {/* E-mail */}
      <div>
        <label
          htmlFor="email"
          className="block text-xs text-white/50 font-semibold mb-1.5 uppercase tracking-wider"
        >
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="o-seu@email.com"
          className="w-full bg-white/8 border border-white/15 text-white placeholder-white/25 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#1A6FBB] focus:bg-white/12 transition-all"
        />
      </div>

      {/* Palavra-passe */}
      <div>
        <label
          htmlFor="password"
          className="block text-xs text-white/50 font-semibold mb-1.5 uppercase tracking-wider"
        >
          Palavra-passe
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••••••"
            className="w-full bg-white/8 border border-white/15 text-white placeholder-white/25 rounded-xl px-4 py-3.5 pr-12 text-sm focus:outline-none focus:border-[#1A6FBB] focus:bg-white/12 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors text-base"
            aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      {/* Erro */}
      {state?.error && (
        <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300 text-center flex items-center gap-2 justify-center">
          <span>⚠️</span>
          <span>{state.error}</span>
        </div>
      )}

      {/* Botão */}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[#1A6FBB] hover:bg-[#1558a0] active:bg-[#0D4F8A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-sm transition-all mt-2 shadow-lg shadow-[#1A6FBB]/30 flex items-center justify-center gap-2"
      >
        {pending ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            A autenticar...
          </>
        ) : (
          "Entrar na plataforma →"
        )}
      </button>
    </form>
  );
}
