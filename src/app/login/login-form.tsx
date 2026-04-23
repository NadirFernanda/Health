"use client";

import { use, useActionState } from "react";
import { loginAction, LoginState } from "@/app/actions/auth";

export default function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = use(searchParams);
  const redirectTo = params.redirect ?? "/admin";
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirectTo} />

      <div className="space-y-3">
        <div>
          <label htmlFor="username" className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">
            Utilizador
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            placeholder="nome de utilizador"
            className="w-full bg-white/5 border border-white/15 text-white placeholder-white/25 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#1A6FBB] focus:bg-white/8 transition-all"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">
            Palavra-passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••••••"
            className="w-full bg-white/5 border border-white/15 text-white placeholder-white/25 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#1A6FBB] focus:bg-white/8 transition-all"
          />
        </div>
      </div>

      {state?.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 text-center">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[#1A6FBB] hover:bg-[#1558a0] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-colors mt-2 shadow-lg shadow-[#1A6FBB]/20"
      >
        {pending ? "A autenticar..." : "Entrar no painel"}
      </button>
    </form>
  );
}
