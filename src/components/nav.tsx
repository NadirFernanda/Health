"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Search, Building2, Wallet, User,
  ClipboardList, CreditCard, ChevronLeft,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const medicoNav: NavItem[] = [
  { href: "/medico",         label: "Início",   icon: Home },
  { href: "/medico/buscar",  label: "Buscar",   icon: Search },
  { href: "/medico/salas",   label: "Salas",    icon: Building2 },
  { href: "/medico/ganhos",  label: "Ganhos",   icon: Wallet },
  { href: "/medico/perfil",  label: "Perfil",   icon: User },
];

const clinicaNav: NavItem[] = [
  { href: "/clinica",            label: "Início",    icon: Home },
  { href: "/clinica/plantoes",   label: "Plantões",  icon: ClipboardList },
  { href: "/clinica/salas",      label: "Salas",     icon: Building2 },
  { href: "/clinica/faturacao",  label: "Faturação", icon: CreditCard },
  { href: "/clinica/conta",      label: "Conta",     icon: User },
];

export function BottomNav({ role }: { role: "medico" | "clinica" }) {
  const pathname = usePathname();
  const navItems = role === "medico" ? medicoNav : clinicaNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-md mx-auto">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${
                active ? "text-[#1A6FBB]" : "text-gray-400"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2 : 1.75} />
              <span className={`text-xs font-medium ${active ? "text-[#1A6FBB]" : "text-gray-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopBar({
  titulo,
  back,
  onBack,
  actions,
}: {
  titulo?: string;
  back?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
      {(back || onBack) && (
        onBack ? (
          <button onClick={onBack} className="text-gray-500 hover:text-[#1A6FBB] transition-colors">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
        ) : (
          <Link href={back!} className="text-gray-500 hover:text-[#1A6FBB] transition-colors">
            <ChevronLeft size={20} strokeWidth={2} />
          </Link>
        )
      )}
      {titulo && <h1 className="text-base font-semibold text-gray-900 flex-1">{titulo}</h1>}
      {!titulo && <div className="flex-1" />}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
