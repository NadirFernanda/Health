/**
 * AdminGate — O acesso ao painel admin é garantido server-side pelo middleware.
 * Este componente apenas renderiza os filhos; a protecção real está em src/middleware.ts
 * que verifica a sessão HMAC e exige role === "ADMIN".
 *
 * REMOVIDA a auth client-side: password hardcoded no bundle, sessionStorage bypassável,
 * NEXT_PUBLIC_* exposto a todos os utilizadores.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
