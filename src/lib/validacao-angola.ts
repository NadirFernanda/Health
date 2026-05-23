/**
 * Validação de documentos de identificação angolanos.
 * Formatos oficiais conforme o SINSE (Sistema Nacional de Identificação e Segurança).
 */

/**
 * Bilhete de Identidade angolano: 9 dígitos + 2 letras maiúsculas + 1 dígito
 * Ex: 001234567LA2, 009876543AB1
 */
export function validarBI(bi: string): boolean {
  if (!bi) return false;
  const clean = bi.replace(/[\s\-]/g, "").toUpperCase();
  return /^\d{9}[A-Z]{2}\d$/.test(clean);
}

/**
 * NIF angolano: 10 dígitos
 * Ex: 5000123456
 */
export function validarNIF(nif: string): boolean {
  if (!nif) return false;
  const clean = nif.replace(/[\s\-\.]/g, "");
  return /^\d{10}$/.test(clean);
}

/**
 * Passaporte angolano: letra N seguida de 8 dígitos, ou 2 letras + 6 dígitos
 * Ex: N12345678, AA123456
 */
export function validarPassaporte(passaporte: string): boolean {
  if (!passaporte) return false;
  const clean = passaporte.replace(/[\s\-]/g, "").toUpperCase();
  return /^N\d{8}$/.test(clean) || /^[A-Z]{2}\d{6}$/.test(clean);
}

/**
 * Valida qualquer documento de identificação angolano (BI ou passaporte)
 */
export function validarDocumentoIdentificacao(doc: string): { valido: boolean; tipo: "BI" | "PASSAPORTE" | null; erro?: string } {
  if (!doc || doc.trim().length === 0) {
    return { valido: false, tipo: null, erro: "Documento obrigatório" };
  }
  if (validarBI(doc)) return { valido: true, tipo: "BI" };
  if (validarPassaporte(doc)) return { valido: true, tipo: "PASSAPORTE" };
  return {
    valido: false,
    tipo: null,
    erro: "Formato inválido. BI: 9 dígitos + 2 letras + 1 dígito (ex: 001234567LA2). Passaporte: N + 8 dígitos ou 2 letras + 6 dígitos.",
  };
}

/**
 * Número de ordem OMA (Ordem dos Médicos de Angola): OMA/ + 4-6 dígitos
 * Ex: OMA/12345, OMA/123456
 */
export function validarNumeroOMA(numero: string): boolean {
  if (!numero) return false;
  const clean = numero.replace(/[\s]/g, "").toUpperCase();
  return /^OMA\/\d{4,6}$/.test(clean);
}

/**
 * SINOME (Sindicato dos Enfermeiros): SINOME/ + 4-6 dígitos
 */
export function validarNumeroSINOME(numero: string): boolean {
  if (!numero) return false;
  const clean = numero.replace(/[\s]/g, "").toUpperCase();
  return /^SINOME\/\d{4,6}$/.test(clean) || /^\d{4,8}$/.test(clean);
}
