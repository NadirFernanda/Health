import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { requireAdminAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

const MIME: Record<string, string> = {
  ".pdf":  "application/pdf",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const auth = await requireAdminAccess("profissionais", "read");
  if (auth instanceof Response) return auth;

  const { docId } = await params;
  const doc = await prisma.clinicaDocumento.findUnique({ where: { id: docId } });
  if (!doc || !doc.ficheiro) return Response.json({ error: "Documento não encontrado" }, { status: 404 });

  const relativePath = doc.ficheiro.replace(/^\/+/, "");
  const filePath = path.join(process.cwd(), "public", relativePath);

  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new Response(buffer, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
      },
    });
  } catch {
    return Response.json({ error: "Ficheiro não encontrado" }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const auth = await requireAdminAccess("profissionais", "write");
  if (auth instanceof Response) return auth;

  const { docId } = await params;
  const { acao } = await request.json() as { acao: string };

  if (acao !== "APROVAR" && acao !== "REJEITAR") {
    return Response.json({ error: "acao deve ser APROVAR ou REJEITAR" }, { status: 400 });
  }

  const doc = await prisma.clinicaDocumento.findUnique({ where: { id: docId } });
  if (!doc) return Response.json({ error: "Documento não encontrado" }, { status: 404 });

  await prisma.clinicaDocumento.update({
    where: { id: docId },
    data: { estado: acao === "APROVAR" ? "APROVADO" : "REJEITADO" },
  });

  return Response.json({ ok: true, estado: acao === "APROVAR" ? "APROVADO" : "REJEITADO" });
}
