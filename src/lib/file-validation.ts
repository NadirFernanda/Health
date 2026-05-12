/**
 * Validação de ficheiros por magic bytes (assinatura binária).
 * NÃO confiar no Content-Type declarado pelo cliente — é falsificável.
 */

type FileSignature = {
  mime: string;
  bytes: (number | null)[];
  offset?: number;
};

const SIGNATURES: FileSignature[] = [
  // PDF: %PDF
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  // JPEG: FF D8 FF
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  // PNG: 89 PNG\r\n\x1a\n
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // WEBP: RIFF????WEBP (offset 8 = WEBP)
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50] },
  // DOCX / XLSX / PPTX: ZIP header PK\x03\x04
  { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes: [0x50, 0x4b, 0x03, 0x04] },
  // DOC: OLE2 header D0CF11E0
  { mime: "application/msword", bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] },
];

function matchesSignature(buf: Buffer, sig: FileSignature): boolean {
  const offset = sig.offset ?? 0;
  if (buf.length < offset + sig.bytes.length) return false;
  return sig.bytes.every((b, i) => b === null || buf[offset + i] === b);
}

export type MimeCheckResult =
  | { ok: true; detectedMime: string }
  | { ok: false; error: string };

/**
 * Valida o tipo real de um ficheiro pelos seus magic bytes.
 * @param buffer - Conteúdo do ficheiro (apenas os primeiros 16 bytes são necessários)
 * @param allowedMimes - Lista de MIME types aceites
 */
export function validateFileMagicBytes(buffer: Buffer, allowedMimes: string[]): MimeCheckResult {
  for (const sig of SIGNATURES) {
    if (matchesSignature(buffer, sig)) {
      if (allowedMimes.includes(sig.mime)) {
        return { ok: true, detectedMime: sig.mime };
      }
      return { ok: false, error: `Tipo de ficheiro não permitido (${sig.mime})` };
    }
  }
  return { ok: false, error: "Tipo de ficheiro não reconhecido ou não suportado" };
}

/**
 * Sanitiza o nome de ficheiro para evitar path traversal e extensões perigosas.
 * Mantém apenas a extensão se estiver na lista de permitidas.
 */
export function sanitizeFilename(
  originalName: string,
  allowedExtensions: string[]
): string | null {
  const safe = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const ext = safe.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedExtensions.includes(ext)) return null;
  const stem = safe.slice(0, safe.lastIndexOf(".")).slice(0, 64);
  return `${stem}.${ext}`;
}

export const ALLOWED_DOC_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const ALLOWED_DOC_EXTS = ["pdf", "jpg", "jpeg", "png", "webp"];

export const ALLOWED_CURRICULO_MIMES = [
  ...ALLOWED_DOC_MIMES,
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const ALLOWED_CURRICULO_EXTS = [...ALLOWED_DOC_EXTS, "doc", "docx"];
