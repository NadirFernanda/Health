import { AdminNav } from "@/components/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // fixed inset-0 + z-[200] garante que o painel admin usa o viewport completo,
    // ignorando o max-width: 430px definido no body para a app mobile.
    <div className="fixed inset-0 bg-gray-100 z-[200] flex flex-col overflow-hidden">
      <AdminNav />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
