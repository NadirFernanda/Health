/**
 * Componente para criar novo support ticket
 * Usado na página de support do utilizador
 */

"use client";

import { FormEvent, useState } from "react";
import { TICKET_CATEGORIES } from "@/lib/support-constants";

interface CreateTicketFormProps {
  onSuccess?: (ticketId: string) => void;
}

export function CreateTicketForm({ onSuccess }: CreateTicketFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    categoria: "",
    assunto: "",
    mensagem: "",
    prioridade: "NORMAL",
    contactoEmail: "",
    contactoTelefone: "",
  });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao criar ticket");
      }

      const data = await response.json();
      setSuccess(true);
      setCreatedTicketId(data.ticket.id);
      setFormData({
        categoria: "",
        assunto: "",
        mensagem: "",
        prioridade: "NORMAL",
        contactoEmail: "",
        contactoTelefone: "",
      });

      onSuccess?.(data.ticket.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {success && createdTicketId && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <p className="font-semibold mb-1">Ticket criado com sucesso!</p>
          <p className="text-sm">Referência: <span className="font-mono font-bold">#{createdTicketId.slice(0, 8).toUpperCase()}</span></p>
          <p className="text-sm mt-1">Pode acompanhar o seu pedido na lista de tickets.</p>
        </div>
      )}

      {/* Categoria */}
      <div>
        <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-2">
          Categoria *
        </label>
        <select
          id="categoria"
          value={formData.categoria}
          onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione uma categoria</option>
          {TICKET_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Assunto */}
      <div>
        <label htmlFor="assunto" className="block text-sm font-medium text-gray-700 mb-2">
          Assunto * (5-120 caracteres)
        </label>
        <input
          id="assunto"
          type="text"
          value={formData.assunto}
          onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
          required
          minLength={5}
          maxLength={120}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Breve descrição do problema"
        />
      </div>

      {/* Mensagem */}
      <div>
        <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700 mb-2">
          Detalhes * (20-3000 caracteres)
        </label>
        <textarea
          id="mensagem"
          value={formData.mensagem}
          onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
          required
          minLength={20}
          maxLength={3000}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Descreva o seu problema em detalhe..."
        />
      </div>

      {/* Prioridade */}
      <div>
        <label htmlFor="prioridade" className="block text-sm font-medium text-gray-700 mb-2">
          Prioridade *
        </label>
        <select
          id="prioridade"
          value={formData.prioridade}
          onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="NORMAL">Normal</option>
          <option value="ALTA">Alta</option>
          <option value="URGENTE">Urgente</option>
        </select>
      </div>

      {/* Campos Opcionais */}
      <div className="border-t pt-4 mt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Informações de Contacto (Opcional)</h3>

        <div className="space-y-4">
          {/* Email de Contacto */}
          <div>
            <label htmlFor="contactoEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Email de Contacto
            </label>
            <input
              id="contactoEmail"
              type="email"
              value={formData.contactoEmail}
              onChange={(e) => setFormData({ ...formData, contactoEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
            />
          </div>

          {/* Telefone de Contacto */}
          <div>
            <label htmlFor="contactoTelefone" className="block text-sm font-medium text-gray-700 mb-2">
              Telefone de Contacto
            </label>
            <input
              id="contactoTelefone"
              type="tel"
              value={formData.contactoTelefone}
              onChange={(e) => setFormData({ ...formData, contactoTelefone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+244 923456789"
            />
          </div>
        </div>
      </div>

      {/* Botão Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition"
      >
        {loading ? "Enviando..." : "Criar Ticket de Suporte"}
      </button>
    </form>
  );
}
