import { BottomNav, TopBar } from "@/components/nav";

export default function MedicoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {children}
      <div className="h-20" />
      <BottomNav role="medico" />
    </div>
  );
}
