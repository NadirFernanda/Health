import { BottomNav } from "@/components/nav";
import ImpersonationBanner from "@/components/impersonation-banner";

export default function MedicoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <ImpersonationBanner />
      {children}
      <div className="h-20" />
      <BottomNav role="medico" />
    </div>
  );
}
