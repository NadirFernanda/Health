import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { getAuthSession, getProfissionalFromSession, getClinicaFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { validateFileMagicBytes } from "@/lib/file-validation";

const ALLOWED_IMG_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) return Response.json({ error: "Não autenticado" }, { status: 401 });

  if (!["MEDICO", "CLINICA"].includes(session.role)) {
    return Response.json({ error: "Sem permissão" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return Response.json({ error: "Ficheiro não fornecido" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: "Ficheiro demasiado grande. Máximo 5 MB." }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "Ficheiro vazio." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const magicCheck = validateFileMagicBytes(buffer, ALLOWED_IMG_MIMES);
  if (!magicCheck.ok) {
    return Response.json({ error: "Formato não suportado. Use JPG, PNG ou WEBP." }, { status: 400 });
  }

  // Resize to max 800×800, convert to webp for consistency and smaller size
  const resized = await sharp(buffer)
    .resize(800, 800, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const filename = `foto-${Date.now()}.webp`;

  if (session.role === "MEDICO") {
    const prof = await getProfissionalFromSession(session);
    if (!prof) return Response.json({ error: "Perfil não encontrado" }, { status: 404 });

    const dir = path.join(process.cwd(), "public", "uploads", "fotos", "medicos", prof.id);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), resized);
    const url = `/uploads/fotos/medicos/${prof.id}/${filename}`;

    await prisma.profissional.update({ where: { id: prof.id }, data: { foto: url } });
    return Response.json({ ok: true, url });
  }

  if (session.role === "CLINICA") {
    const clinica = await getClinicaFromSession(session);
    if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

    const dir = path.join(process.cwd(), "public", "uploads", "fotos", "clinicas", clinica.id);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), resized);
    const url = `/uploads/fotos/clinicas/${clinica.id}/${filename}`;

    await prisma.clinica.update({ where: { id: clinica.id }, data: { logo: url } });
    return Response.json({ ok: true, url });
  }

  return Response.json({ error: "Sem permissão" }, { status: 403 });
}
