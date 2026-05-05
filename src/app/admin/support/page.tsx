/**
 * Página admin para gerenciar support tickets
 * GET /admin/support/tickets
 */

import { AdminSupportTickets } from "@/components/admin-support-tickets";

export default function AdminSupportPage() {
  return (
    <div className="h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gerenciamento de Support Tickets
        </h1>
        <p className="text-gray-600 mt-2">
          Visualize, responda e gerencie todos os tickets de suporte
        </p>
      </div>

      {/* Componente Admin */}
      <div className="h-[calc(100vh-100px)]">
        <AdminSupportTickets />
      </div>
    </div>
  );
}
