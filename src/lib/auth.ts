/**
 * Utilitários de autenticação — compatíveis com Edge Runtime (Web Crypto API apenas).
 * NÃO importar APIs Node.js neste módulo.
 */

export const COOKIE_NAME = "planto_session";
export const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 horas

const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer as ArrayBuffer;
}

async function getHmacKey(): Promise<CryptoKey> {
  const secret =
    process.env.AUTH_SECRET ?? "planto-secret-ALTERAR-em-producao-32chars+";
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Cria um token HMAC-SHA256 assinado: base64url(payload).hexSig
 */
export async function createSessionToken(username: string): Promise<string> {
  const payload = btoa(JSON.stringify({ sub: username, iat: Date.now() }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const key = await getHmacKey();
  const sig = toHex(
    await crypto.subtle.sign("HMAC", key, encoder.encode(payload))
  );
  return `${payload}.${sig}`;
}

/**
 * Verifica a assinatura HMAC. Retorna true apenas se válido.
 */
export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return false;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (!payload || !sig || sig.length !== 64) return false;
    const key = await getHmacKey();
    return await crypto.subtle.verify(
      "HMAC",
      key,
      fromHex(sig),
      encoder.encode(payload)
    );
  } catch {
    return false;
  }
}
