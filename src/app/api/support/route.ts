/**
 * POST /api/support/tickets
 * Criar novo support ticket
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limiter";
import {
  isValidCategory,
  notifyAdminsNewTicket,
} from "@/lib/support-utils";
import { z } from "zod";

const CreateTicketSchema = z.object({
  categoria: z.string().min(1, "Categoria obrigatória"),
  assunto: z
    .string()
    .min(5, "Assunto deve ter pelo menos 5 caracteres")
    .max(120, "Assunto não pode exceder 120 caracteres"),
  mensagem: z
    .string()
    .min(20, "Mensagem deve ter pelo menos 20 caracteres")
    .max(3000, "Mensagem não pode exceder 3000 caracteres"),
  prioridade: z.enum(["NORMAL", "ALTA", "URGENTE"]),
  userProvidedId: z.string().optional(),
  contactoEmail: z.string().email().optional().or(z.literal("")),
  contactoTelefone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSession();
    if (authResult instanceof Response) return authResult;
    const { session } = authResult;

    // Rate limiting: máximo 3 tickets a cada 10 minutos
    const rateLimitKey = `support-ticket:${session.id}`;
    const rateLimit = await checkRateLimit({
      key: rateLimitKey,
      maxRequests: 3,
      windowSeconds: 600, // 10 minutos
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Limite de tickets atingido. Tente novamente em ${Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)} segundos`,
        },
        { status: 429 }
      );
    }

    // Validar payload
    const body = await request.json();
    const data = CreateTicketSchema.parse(body);

    // Validar categoria
    if (!isValidCategory(data.categoria)) {
      return NextResponse.json(
        { error: "Categoria inválida" },
        { status: 400 }
      );
    }

    // Criar ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.id,
        categoria: data.categoria,
        assunto: data.assunto,
        mensagem: data.mensagem,
        prioridade: data.prioridade,
        userProvidedId: data.userProvidedId || null,
        contactoEmail: data.contactoEmail || null,
        contactoTelefone: data.contactoTelefone || null,
        estado: "ABERTO",
      },
    });

    // Notificar admins
    await notifyAdminsNewTicket(ticket.id);

    return NextResponse.json(
      {
        message: "Ticket criado com sucesso",
        ticket: {
          id: ticket.id,
          assunto: ticket.assunto,
          prioridade: ticket.prioridade,
          estado: ticket.estado,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating support ticket:", error);
    return NextResponse.json(
      { error: "Erro ao criar ticket" },
      { status: 500 }
    );
  }
}
