"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin",            label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/medicos",    label: "Médicos",   icon: "👨‍⚕️" },
  { href: "/admin/clinicas",   label: "Clínicas",  icon: "🏥" },
  { href: "/admin/plantoes",   label: "Plantões",  icon: "📋" },
  { href: "/admin/transacoes", label: "Finanças",  icon: "💰" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <header className="bg-[#0D1F3C] text-white shrink-0 shadow-lg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1A6FBB] rounded-lg flex items-center justify-center font-black text-base">P</div>
          <div>
            <p className="font-bold text-sm leading-tight tracking-wide">PLANTO ADMIN</p>
            <p className="text-white/40 text-xs leading-tight">Painel de Gestão</p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1 text-white/50 hover:text-white/80 text-xs transition-colors border border-white/10 px-2.5 py-1 rounded-lg"
        >
          ← App
        </Link>
      </div>

      {/* Nav tabs */}
      <nav className="flex overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? "border-[#1A6FBB] text-white bg-white/5"
                  : "border-transparent text-white/50 hover:text-white/75"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
