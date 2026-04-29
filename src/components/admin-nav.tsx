"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import {
  BarChart2, Stethoscope, Building2, ClipboardList, Wallet,
  ChevronLeft, type LucideIcon,
} from "lucide-react";

const navItems: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: "/admin",            label: "Dashboard",    icon: BarChart2,     exact: true },
  { href: "/admin/medicos",    label: "Profissionais", icon: Stethoscope },
  { href: "/admin/clinicas",   label: "Clínicas",     icon: Building2 },
  { href: "/admin/plantoes",   label: "Plantões",     icon: ClipboardList },
  { href: "/admin/transacoes", label: "Finanças",     icon: Wallet },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <header className="bg-[#062855] text-white shrink-0 shadow-lg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div>
            <img
              src="/Imagens/LOGO_MED_FREELA.png"
              alt="MedFreela"
              className="h-8 w-auto object-contain"
            />
          </div>
          <div>
            <p className="font-bold text-xs leading-tight tracking-widest text-white/80">PAINEL DE GESTÃO</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1 text-white/50 hover:text-white/80 text-xs transition-colors border border-white/10 px-2.5 py-1 rounded-lg"
          >
            <ChevronLeft size={13} strokeWidth={2} />
            App
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-white/40 hover:text-red-400 text-xs transition-colors border border-white/10 hover:border-red-400/30 px-2.5 py-1 rounded-lg"
            >
              Sair
            </button>
          </form>
        </div>
      </div>

      {/* Nav tabs */}
      <nav className="flex overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? "border-[#0B3C74] text-white bg-white/5"
                  : "border-transparent text-white/50 hover:text-white/75"
              }`}
            >
              <Icon size={14} strokeWidth={1.75} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
