import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/api-auth";

const MIME: Record<string, string> = {
  ".pdf":  "application/pdf",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".webp": "image/webp",
  ".doc":  "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await params;

  // Prevent directory traversal
  if (!parts || parts.some((p) => p.includes("..") || p === "" || p.includes("\0"))) {
    return new Response("Forbidden", { status: 403 });
  }

  // Expected: medicos/{profId}/{filename}  OR  clinicas/{clinicaId}/{filename}
  if (parts.length !== 3 || !["medicos", "clinicas"].includes(parts[0])) {
    return new Response("Not Found", { status: 404 });
  }

  const [tipo, ownerId, filename] = parts;

  if (tipo === "clinicas") {
    const session = await getAuthSession();
    if (!session) return new Response("Não autorizado", { status: 401 });

    if (session.role === "CLINICA") {
      const clinica = await prisma.clinica.findUnique({ where: { userId: session.id }, select: { id: true } });
      if (clinica?.id !== ownerId) return new Response("Proibido", { status: 403 });
    } else if (session.role !== "ADMIN") {
      return new Response("Proibido", { status: 403 });
    }

    const filePath = path.join(process.cwd(), "public", "uploads", "clinicas", ownerId, filename);
    try {
      const buffer = await fs.readFile(filePath);
      const ext = path.extname(filename).toLowerCase();
      const mime = MIME[ext] ?? "application/octet-stream";
      return new Response(buffer, {
        headers: {
          "Content-Type": mime,
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      return new Response("Ficheiro não encontrado", { status: 404 });
    }
  }

  const profId = ownerId;

  // Look up in DB to determine visibility
  const doc = await prisma.documento.findFirst({
    where: { profissionalId: profId, ficheiro: { endsWith: filename } },
    select: { tipo: true },
  });

  const isPublic = doc?.tipo === "CURRICULO";

  if (!isPublic) {
    const session = await getAuthSession();
    if (!session) return new Response("Não autorizado", { status: 401 });

    if (session.role === "MEDICO") {
      const prof = await prisma.profissional.findUnique({
        where: { userId: session.id },
        select: { id: true },
      });
      if (prof?.id !== profId) return new Response("Proibido", { status: 403 });
    } else if (session.role !== "ADMIN") {
      return new Response("Proibido", { status: 403 });
    }
  }

  const filePath = path.join(process.cwd(), "public", "uploads", "medicos", profId, filename);

  try {
    const buffer = await fs.readFile(filePath);
    const ext   = path.extname(filename).toLowerCase();
    const mime  = MIME[ext] ?? "application/octet-stream";

    return new Response(buffer, {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": isPublic ? "public, max-age=3600" : "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Ficheiro não encontrado", { status: 404 });
  }
}
