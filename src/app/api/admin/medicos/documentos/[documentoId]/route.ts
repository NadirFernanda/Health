import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { requireAdminAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ documentoId: string }> }
) {
  const { documentoId } = await params;
  const auth = await requireAdminAccess("profissionais", "write");
  if (auth instanceof Response) return auth;

  const body = await request.json().catch(() => ({}));
  const { acao } = body as { acao?: string };

  if (acao !== "APROVAR" && acao !== "REJEITAR") {
    return Response.json({ error: "acao deve ser APROVAR ou REJEITAR" }, { status: 400 });
  }

  const doc = await prisma.documento.findUnique({ where: { id: documentoId } });
  if (!doc) return Response.json({ error: "Documento não encontrado" }, { status: 404 });

  await prisma.documento.update({
    where: { id: documentoId },
    data: { estado: acao === "APROVAR" ? "APROVADO" : "REJEITADO" },
  });

  return Response.json({ ok: true, estado: acao === "APROVAR" ? "APROVADO" : "REJEITADO" });
}

function getMimeType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentoId: string }> }
) {
  const resolvedParams = await params;
  const auth = await requireAdminAccess("profissionais", "read");
  if (auth instanceof Response) return auth;

  const documento = await prisma.documento.findUnique({
    where: { id: resolvedParams.documentoId },
  });

  if (!documento || !documento.ficheiro) {
    return Response.json(
      { error: "Documento não encontrado" },
      { status: 404 }
    );
  }

  const relativePath = documento.ficheiro.replace(/^\/+/, "");
  const filePath = path.join(process.cwd(), "public", relativePath);

  try {
    const buffer = await fs.readFile(filePath);
    const mimeType = getMimeType(filePath);

    return new Response(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
      },
    });
  } catch (error) {
    return Response.json(
      { error: "Ficheiro não encontrado" },
      { status: 404 }
    );
  }
}
