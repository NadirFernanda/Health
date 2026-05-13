"use client";
import { useEffect, useState } from "react";
import { Plus, Shield, ShieldOff, ChevronDown } from "lucide-react";

type AdminRole = "FINANCEIRO" | "GESTOR" | "SUPORTE" | "ANALISTA";

type Admin = {
  id: string;
  email: string;
  adminRole: AdminRole | null;
  adminEmail: string | null;
  adminCargo: string | null;
  adminPhone: string | null;
  criadoEm: string;
  isActive: boolean;
};

const roleBadge: Record<string, { cls: string; label: string }> = {
  FINANCEIRO: { cls: "bg-blue-100 text-blue-700",   label: "Financeiro" },
  GESTOR:     { cls: "bg-[#0B3C74]/10 text-[#0B3C74]", label: "Gestor" },
  SUPORTE:    { cls: "bg-teal-100 text-teal-700", label: "Suporte" },
  ANALISTA:   { cls: "bg-teal-100 text-teal-700",    label: "Analista" },
  MASTER:     { cls: "bg-[#0B3C74]/10 text-[#0B3C74]", label: "Master" },
};

function getRoleBadge(adminRole: AdminRole | null) {
  return roleBadge[adminRole ?? "MASTER"];
}

const ROLES: AdminRole[] = ["FINANCEIRO", "GESTOR", "SUPORTE", "ANALISTA"];

export default function AdminAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // New admin form state
  const [fEmail, setFEmail] = useState("");
  const [fPassword, setFPassword] = useState("");
  const [fRole, setFRole] = useState<AdminRole>("SUPORTE");
  const [fCargo, setFCargo] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/admins", { credentials: "include" })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${r.status}`);
        return body as Admin[];
      })
      .then(setAdmins)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const toggleActive = async (admin: Admin) => {
    const method = admin.isActive ? "DELETE" : "PATCH";
    const body = admin.isActive ? undefined : JSON.stringify({ isActive: true });
    const res = await fetch(`/api/admin/admins/${admin.id}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body,
    });
    if (res.ok) {
      setAdmins((prev) => prev.map((a) => a.id === admin.id ? { ...a, isActive: !admin.isActive } : a));
    }
  };

  const changeRole = async (admin: Admin, role: AdminRole) => {
    const res = await fetch(`/api/admin/admins/${admin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminRole: role }),
    });
    if (res.ok) {
      setAdmins((prev) => prev.map((a) => a.id === admin.id ? { ...a, adminRole: role } : a));
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fEmail, password: fPassword, adminRole: fRole, adminCargo: fCargo || undefined, adminPhone: fPhone || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      setAdmins((prev) => [...prev, data as Admin]);
      setShowForm(false);
      setFEmail(""); setFPassword(""); setFCargo(""); setFPhone("");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="p-4 pt-10 flex justify-center">
      <div className="w-8 h-8 border-2 border-[#0B3C74] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="p-4 pt-10 flex justify-center">
      <div className="max-w-xl text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl p-4 text-center">{error}</div>
    </div>
  );

  return (
    <div className="p-4 space-y-4 pb-10 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-base font-bold text-gray-900">Gestão de Admins</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 bg-[#0B3C74] text-white text-xs font-semibold px-3 py-2 rounded-xl"
        >
          <Plus size={13} strokeWidth={2.5} /> Novo Admin
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={submitCreate} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800">Criar novo sub-admin</p>

          <div className="grid grid-cols-1 gap-3">
            <input
              required type="email" placeholder="Email"
              value={fEmail} onChange={(e) => setFEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0B3C74]"
            />
            <input
              required type="password" placeholder="Palavra-passe (mín. 8 caracteres)"
              value={fPassword} onChange={(e) => setFPassword(e.target.value)}
              minLength={8}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0B3C74]"
            />
            <select
              value={fRole} onChange={(e) => setFRole(e.target.value as AdminRole)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0B3C74] bg-white"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{roleBadge[r].label}</option>
              ))}
            </select>
            <input
              type="text" placeholder="Cargo (opcional)"
              value={fCargo} onChange={(e) => setFCargo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0B3C74]"
            />
            <input
              type="text" placeholder="Telefone (opcional)"
              value={fPhone} onChange={(e) => setFPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0B3C74]"
            />
          </div>

          {formError && <p className="text-xs text-red-500">{formError}</p>}

          <div className="flex gap-2">
            <button
              type="submit" disabled={submitting}
              className="flex-1 bg-[#0B3C74] disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl"
            >
              {submitting ? "A criar…" : "Criar Admin"}
            </button>
            <button
              type="button" onClick={() => { setShowForm(false); setFormError(null); }}
              className="flex-1 border border-gray-200 text-gray-500 text-xs font-medium py-3 rounded-xl"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-3">
        {admins.map((admin) => {
          const badge = getRoleBadge(admin.adminRole);
          const isMaster = admin.adminRole === null;
          return (
            <div key={admin.id} className={`bg-white rounded-2xl border p-4 ${!admin.isActive ? "opacity-50 border-gray-100" : "border-gray-100"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{admin.adminEmail ?? admin.email}</p>
                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                    {!admin.isActive && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-400">Inativo</span>
                    )}
                  </div>
                  {admin.adminCargo && (
                    <p className="text-xs text-gray-400 mt-0.5">{admin.adminCargo}</p>
                  )}
                  <p className="text-[10px] text-gray-300 mt-1">
                    Desde {new Date(admin.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {!isMaster && (
                <div className="flex gap-2 mt-3">
                  {/* Role picker */}
                  <div className="relative flex-1">
                    <select
                      value={admin.adminRole ?? ""}
                      onChange={(e) => changeRole(admin, e.target.value as AdminRole)}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-medium bg-white outline-none focus:border-[#0B3C74] pr-7"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{roleBadge[r].label}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Toggle active */}
                  <button
                    onClick={() => toggleActive(admin)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                      admin.isActive
                        ? "border-red-200 text-red-400 active:bg-red-50"
                        : "border-green-200 text-green-600 active:bg-green-50"
                    }`}
                  >
                    {admin.isActive ? <ShieldOff size={13} strokeWidth={2} /> : <Shield size={13} strokeWidth={2} />}
                    {admin.isActive ? "Desativar" : "Reativar"}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {admins.length === 0 && (
          <div className="text-center py-14 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
            Nenhum admin encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
