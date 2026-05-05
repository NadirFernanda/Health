import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function createAuditLog(
  action: string,
  details: Record<string, unknown>,
  userId?: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma
) {
  try {
    await tx.auditLog.create({
      data: {
        action,
        entity: String((details as any).entity ?? "unknown"),
        entityId: (details as any).entityId ? String((details as any).entityId) : null,
        detalhes: details as Prisma.InputJsonValue,
        usuarioId: userId,
      },
    });
  } catch (error) {
    console.warn("Falha ao gravar audit log", error);
  }
}
