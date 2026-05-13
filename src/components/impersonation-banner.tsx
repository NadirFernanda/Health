import { cookies } from "next/headers";
import { getPayloadFromToken } from "@/lib/auth";
import { exitImpersonationAction } from "@/app/actions/impersonate";
import { ShieldAlert, LogOut } from "lucide-react";

const ADMIN_TOKEN_COOKIE = "medfreela_admin_token";

export default async function ImpersonationBanner() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_TOKEN_COOKIE)?.value;
  if (!adminToken) return null;

  const adminPayload = getPayloadFromToken(adminToken);
  const adminEmail = adminPayload?.sub ?? "Admin";

  return (
    <div className="sticky top-0 z-50 bg-[#00A99D] text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-2 min-w-0">
        <ShieldAlert size={15} strokeWidth={2.5} className="shrink-0" />
        <p className="text-xs font-bold truncate">
          Modo Suporte — {adminEmail}
        </p>
      </div>
      <form action={exitImpersonationAction}>
        <button
          type="submit"
          className="shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
        >
          <LogOut size={12} strokeWidth={2.5} />
          Sair
        </button>
      </form>
    </div>
  );
}
