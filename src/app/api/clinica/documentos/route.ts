import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { requireSession, getClinicaFromSession } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export const TIPOS_CLINICA = [
  "ALVARA",
  "REGISTO_COMERCIAL",
  "NIF",
  "CARTEIRA_DIRETOR",
  "TERMO_RESPONSABILIDADE",
] as const;

type TipoDocClinica = (typeof TIPOS_CLINICA)[number];

export async function GET() {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;

  const clinica = await getClinicaFromSession(auth.session);
  if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

  const docs = await prisma.clinicaDocumento.findMany({
    where: { clinicaId: clinica.id },
    orderBy: { criadoEm: "asc" },
  });

  return Response.json(
    TIPOS_CLINICA.map((tipo) => {
      const doc = docs.find((d) => d.tipo === tipo);
      const url = doc?.ficheiro ? `/api/files/clinicas/${clinica.id}/${path.basename(doc.ficheiro)}` : null;
      return {
        tipo,
        id: doc?.id ?? null,
        estado: doc?.estado ?? "NAO_ENVIADO",
        url,
        criadoEm: doc?.criadoEm?.toISOString() ?? null,
      };
    })
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireSession("CLINICA");
  if (auth instanceof Response) return auth;

  const clinica = await getClinicaFromSession(auth.session);
  if (!clinica) return Response.json({ error: "Clínica não encontrada" }, { status: 404 });

  const formData = await request.formData();
  const tipo = formData.get("tipo");
  const file = formData.get("file");

  if (!tipo || typeof tipo !== "string" || !TIPOS_CLINICA.includes(tipo as TipoDocClinica)) {
    return Response.json({ error: "Tipo de documento inválido" }, { status: 400 });
  }
  if (!file || !(file instanceof File)) {
    return Response.json({ error: "Ficheiro não fornecido" }, { status: 400 });
  }

  const arquivo = file as File;
  if (arquivo.size > 10 * 1024 * 1024) {
    return Response.json({ error: "Ficheiro demasiado grande. Máximo 10 MB." }, { status: 400 });
  }

  const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (!allowedMimes.includes(arquivo.type)) {
    return Response.json({ error: "Formato não suportado. Use PDF, JPG ou PNG." }, { status: 400 });
  }

  const safeName = arquivo.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "clinicas", clinica.id);
  await fs.mkdir(uploadsDir, { recursive: true });
  const filename = `${Date.now()}-${safeName}`;
  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, Buffer.from(await arquivo.arrayBuffer()));

  const relativePath = `/uploads/clinicas/${clinica.id}/${filename}`;

  const documento = await prisma.clinicaDocumento.upsert({
    where: { clinicaId_tipo: { clinicaId: clinica.id, tipo } },
    create: { clinicaId: clinica.id, tipo, ficheiro: relativePath, estado: "PENDENTE" },
    update: { ficheiro: relativePath, estado: "PENDENTE" },
  });

  // If clinic was REJEITADO and re-submits a doc, move back to EM_ANALISE
  if (clinica.estadoVerificacao === "REJEITADO") {
    await prisma.clinica.update({
      where: { id: clinica.id },
      data: { estadoVerificacao: "EM_ANALISE" },
    });
  }

  return Response.json({ ok: true, documento: { id: documento.id, tipo, estado: documento.estado } });
}
