import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { requireSession, getProfissionalFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

const allowedTipos = [
  "CEDULA_OMA",
  "BI_PASSAPORTE",
  "CURRICULO",
] as const;

type TipoDocumento = (typeof allowedTipos)[number];

export async function GET() {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;

  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  const documentos = await prisma.documento.findMany({
    where: { profissionalId: prof.id },
    orderBy: { criadoEm: "asc" },
  });

  return Response.json(
    documentos.map((doc) => ({
      id: doc.id,
      tipo: doc.tipo,
      estado: doc.estado,
      ficheiro: doc.ficheiro ?? null,
      criadoEm: doc.criadoEm.toISOString(),
    }))
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireSession("MEDICO");
  if (auth instanceof Response) return auth;

  const prof = await getProfissionalFromSession(auth.session);
  if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

  const formData = await request.formData();
  const tipo = formData.get("tipo");
  const file = formData.get("file");

  if (!tipo || typeof tipo !== "string" || !allowedTipos.includes(tipo as TipoDocumento)) {
    return Response.json({ error: "Tipo de documento inválido" }, { status: 400 });
  }
  if (!file || !(file instanceof File)) {
    return Response.json({ error: "Ficheiro não fornecido" }, { status: 400 });
  }

  const arquivo = file as File;
  if (arquivo.size > 10 * 1024 * 1024) {
    return Response.json({ error: "Ficheiro demasiado grande. Máximo 10 MB." }, { status: 400 });
  }

  const allowedMimes = [
    "application/pdf", "image/jpeg", "image/png", "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const isCurriculo = tipo === "CURRICULO";
  const allowedForTipo = isCurriculo
    ? allowedMimes
    : ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (!allowedForTipo.includes(arquivo.type)) {
    return Response.json({
      error: isCurriculo
        ? "Formato não suportado. Use PDF, DOC ou DOCX."
        : "Formato não suportado. Use PDF, JPG ou PNG.",
    }, { status: 400 });
  }

  const safeName = arquivo.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "medicos", prof.id);
  await fs.mkdir(uploadsDir, { recursive: true });
  const filename = `${Date.now()}-${safeName}`;
  const filePath = path.join(uploadsDir, filename);
  const buffer = Buffer.from(await arquivo.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  const relativePath = `/uploads/medicos/${prof.id}/${filename}`;

  const existing = await prisma.documento.findFirst({
    where: { profissionalId: prof.id, tipo },
  });

  const documento = existing
    ? await prisma.documento.update({
        where: { id: existing.id },
        data: { ficheiro: relativePath, estado: "PENDENTE" },
      })
    : await prisma.documento.create({
        data: {
          profissionalId: prof.id,
          tipo,
          ficheiro: relativePath,
          estado: "PENDENTE",
        },
      });

  return Response.json({
    ok: true,
    documento: {
      id: documento.id,
      tipo: documento.tipo,
      estado: documento.estado,
      ficheiro: documento.ficheiro,
    },
  });
}
