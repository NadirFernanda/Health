import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

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
  { params }: { params: { documentoId: string } }
) {
  const auth = await requireSession("ADMIN");
  if (auth instanceof Response) return auth;

  const documento = await prisma.documento.findUnique({
    where: { id: params.documentoId },
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
