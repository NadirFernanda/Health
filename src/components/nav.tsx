"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const medicoNav: NavItem[] = [
  { href: "/medico", label: "Início", icon: "🏠" },
  { href: "/medico/buscar", label: "Buscar", icon: "🔍" },
  { href: "/medico/ganhos", label: "Ganhos", icon: "💰" },
  { href: "/medico/perfil", label: "Perfil", icon: "👤" },
];

const clinicaNav: NavItem[] = [
  { href: "/clinica", label: "Início", icon: "🏠" },
  { href: "/clinica/plantoes", label: "Plantões", icon: "📋" },
  { href: "/clinica/faturacao", label: "Faturação", icon: "💳" },
  { href: "/clinica/conta", label: "Conta", icon: "👤" },
];

export function BottomNav({ role }: { role: "medico" | "clinica" }) {
  const pathname = usePathname();
  const navItems = role === "medico" ? medicoNav : clinicaNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-md mx-auto">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${
                active ? "text-brand-500" : "text-gray-400"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={`text-xs font-medium ${active ? "text-brand-500" : "text-gray-400"}`}>
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
  actions,
}: {
  titulo?: string;
  back?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
      {back && (
        <Link href={back} className="text-gray-500 hover:text-brand-500 transition-colors">
          ← 
        </Link>
      )}
      {titulo && <h1 className="text-base font-semibold text-gray-900 flex-1">{titulo}</h1>}
      {!titulo && <div className="flex-1" />}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
