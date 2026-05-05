import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { getAuthSession } from "@/lib/api-auth";
import { getAccessibleModules } from "@/lib/admin-permissions";
import { prisma } from "@/lib/db";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthSession();
  if (!auth || auth.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { adminRole: true },
  });

  if (!user) {
    redirect("/admin/login");
  }

  const accessibleModules = await getAccessibleModules(auth.id, user.adminRole ?? null);

  return (
    // fixed inset-0 + z-[200] garante que o painel admin usa o viewport completo,
    // ignorando o max-width: 430px definido no body para a app mobile.
    <div className="fixed inset-0 bg-gray-100 z-[200] flex flex-col overflow-hidden">
      <AdminNav accessibleModules={accessibleModules} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
