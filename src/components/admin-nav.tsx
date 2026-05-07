"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import {
  BarChart2, Stethoscope, Building2, Building, ClipboardList, Wallet, Headphones, AlertTriangle,
  Users, ChevronLeft, CreditCard, type LucideIcon,
} from "lucide-react";
import type { AdminModule, AccessLevel } from "@/lib/admin-permissions";

const navItems: { href: string; label: string; icon: LucideIcon; module: AdminModule; exact?: boolean }[] = [
  { href: "/admin",                 label: "Dashboard",      icon: BarChart2,    module: "dashboard", exact: true },
  { href: "/admin/medicos",         label: "Profissionais",  icon: Stethoscope, module: "profissionais" },
  { href: "/admin/clinicas",        label: "Clínicas",       icon: Building2,   module: "profissionais" },
  { href: "/admin/consultorios",    label: "Consultórios",   icon: Building,    module: "profissionais" },
  { href: "/admin/plantoes",        label: "Plantões",       icon: ClipboardList, module: "plantoes" },
  { href: "/admin/transacoes",      label: "Finanças",      icon: Wallet,      module: "financeiro" },
  { href: "/admin/pagamentos",      label: "Pagamentos",    icon: CreditCard,  module: "financeiro" },
  { href: "/admin/disputas",        label: "Disputas",       icon: AlertTriangle, module: "disputas" },
  { href: "/admin/support",         label: "Suporte",        icon: Headphones,  module: "suporte" },
  { href: "/admin/admins",          label: "Admins",         icon: Users,       module: "admins" },
];

export function AdminNav({ accessibleModules }: { accessibleModules: Partial<Record<AdminModule, AccessLevel>> }) {
  const pathname = usePathname();
  const navItemsToShow = navItems.filter((item) => {
    const level = accessibleModules[item.module] ?? "none";
    return level !== "none";
  });

  return (
    <header className="bg-[#062855] text-white shrink-0 shadow-lg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg px-2 py-1 shadow">
            <img
              src="/Imagens/LOGO_MED_FREELA.png"
              alt="MedFreela"
              className="object-contain h-8 w-auto"
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
        {navItemsToShow.map((item) => {
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
