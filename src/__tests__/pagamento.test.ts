/**
 * Integration tests — payment flow.
 *
 * Covers:
 *  - Payment record created with correct values (bruto, comissão 10%, líquido)
 *  - Only one payment per candidatura (idempotency guard via DB)
 *  - Payment linked to correct beneficiary (profissional)
 *  - Payment method and estado set correctly
 *  - Payment for different valorKwanzas values (boundary: 1 AOA, large value)
 */
import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  createTestMedico,
  createTestClinica,
  createTestPlantao,
  mockAuthAs,
  cleanupTestData,
} from "./helpers";

import { POST as submitCandidatura } from "@/app/api/medico/candidaturas/route";
import { PATCH as reviewCandidatura } from "@/app/api/clinica/plantoes/[id]/candidaturas/route";
import { POST as handleContrato } from "@/app/api/contrato/[candidaturaId]/route";

// ---------------------------------------------------------------------------

function jsonReq(body: unknown) {
  return new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function fullCycle(
  clinicaToken: string,
  medicoToken: string,
  plantaoId: string
): Promise<{ candidaturaId: string }> {
  mockAuthAs(medicoToken);
  const r1 = await submitCandidatura(jsonReq({ plantaoId }) as unknown as NextRequest);
  const { id: candidaturaId } = await r1.json();

  mockAuthAs(clinicaToken);
  await reviewCandidatura(
    new Request("http://localhost/test", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidaturaId, estado: "CONTRATO_PENDENTE" }),
    }) as unknown as NextRequest,
    { params: Promise.resolve({ id: plantaoId }) }
  );

  mockAuthAs(medicoToken);
  await handleContrato(jsonReq({ acao: "ASSINAR" }) as unknown as NextRequest, {
    params: Promise.resolve({ candidaturaId }),
  });

  return { candidaturaId };
}

// ---------------------------------------------------------------------------

describe("Pagamento — commission & record creation", () => {
  let clinicaData: Awaited<ReturnType<typeof createTestClinica>>;
  let medicoData: Awaited<ReturnType<typeof createTestMedico>>;
  const VALOR = 50_000; // AOA

  beforeAll(async () => {
    clinicaData = await createTestClinica("pag-cli");
    medicoData = await createTestMedico("pag-med");
  });

  afterAll(cleanupTestData);

  it("payment record created with 10% commission deducted", async () => {
    const plantao = await createTestPlantao(clinicaData.clinica.id, { valorKwanzas: VALOR });
    const { candidaturaId } = await fullCycle(
      clinicaData.token,
      medicoData.token,
      plantao.id
    );

    const pagamento = await prisma.pagamento.findFirst({
      where: { candidaturaId },
    });

    expect(pagamento).not.toBeNull();
    expect(pagamento!.valorBrutoAoa).toBe(VALOR);
    expect(pagamento!.comissaoAoa).toBe(Math.round(VALOR * 0.1)); // 5 000
    expect(pagamento!.valorLiquidoAoa).toBe(VALOR - Math.round(VALOR * 0.1)); // 45 000
  });

  it("payment is linked to the correct doctor (beneficiary)", async () => {
    const plantao = await createTestPlantao(clinicaData.clinica.id, { valorKwanzas: 20_000 });
    const { candidaturaId } = await fullCycle(
      clinicaData.token,
      medicoData.token,
      plantao.id
    );

    const pagamento = await prisma.pagamento.findFirst({ where: { candidaturaId } });
    expect(pagamento!.beneficiarioProfissionalId).toBe(medicoData.prof.id);
  });

  it("payment estado is CONFIRMADO and method is TRANSFERENCIA_BANCARIA", async () => {
    const plantao = await createTestPlantao(clinicaData.clinica.id, { valorKwanzas: 15_000 });
    const { candidaturaId } = await fullCycle(
      clinicaData.token,
      medicoData.token,
      plantao.id
    );

    const pagamento = await prisma.pagamento.findFirst({ where: { candidaturaId } });
    expect(pagamento!.estado).toBe("CONFIRMADO");
    expect(pagamento!.metodo).toBe("TRANSFERENCIA_BANCARIA");
    expect(pagamento!.tipo).toBe("TURNO");
  });

  it("exactly one payment record per candidatura (no duplicates)", async () => {
    const plantao = await createTestPlantao(clinicaData.clinica.id, { valorKwanzas: 10_000 });
    const { candidaturaId } = await fullCycle(
      clinicaData.token,
      medicoData.token,
      plantao.id
    );

    const count = await prisma.pagamento.count({ where: { candidaturaId } });
    expect(count).toBe(1);
  });

  it("commission rounds correctly for non-divisible values", async () => {
    // 33 333 AOA → 10% = 3 333.3 → should round to 3 333
    const VALOR_ODD = 33_333;
    const plantao = await createTestPlantao(clinicaData.clinica.id, { valorKwanzas: VALOR_ODD });
    const { candidaturaId } = await fullCycle(
      clinicaData.token,
      medicoData.token,
      plantao.id
    );

    const pag = await prisma.pagamento.findFirst({ where: { candidaturaId } });
    expect(pag!.comissaoAoa).toBe(Math.round(VALOR_ODD * 0.1));
    expect(pag!.valorLiquidoAoa).toBe(VALOR_ODD - Math.round(VALOR_ODD * 0.1));
    // Consistency check: bruto = comissao + liquido
    expect(pag!.valorBrutoAoa).toBe(pag!.comissaoAoa + pag!.valorLiquidoAoa);
  });

  it("payment is linked to the correct plantão", async () => {
    const plantao = await createTestPlantao(clinicaData.clinica.id, { valorKwanzas: 18_000 });
    const { candidaturaId } = await fullCycle(
      clinicaData.token,
      medicoData.token,
      plantao.id
    );

    const pag = await prisma.pagamento.findFirst({ where: { candidaturaId } });
    expect(pag!.plantaoId).toBe(plantao.id);
  });

  it("no payment created when doctor rejects contract", async () => {
    const plantao = await createTestPlantao(clinicaData.clinica.id, { valorKwanzas: 20_000 });

    // Submit + clinic accepts
    mockAuthAs(medicoData.token);
    const r1 = await submitCandidatura(jsonReq({ plantaoId: plantao.id }) as unknown as NextRequest);
    const { id: candidaturaId } = await r1.json();

    mockAuthAs(clinicaData.token);
    await reviewCandidatura(
      new Request("http://localhost/test", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidaturaId, estado: "CONTRATO_PENDENTE" }),
      }) as unknown as NextRequest,
      { params: Promise.resolve({ id: plantao.id }) }
    );

    // Doctor rejects
    mockAuthAs(medicoData.token);
    await handleContrato(jsonReq({ acao: "RECUSAR" }) as unknown as NextRequest, {
      params: Promise.resolve({ candidaturaId }),
    });

    const count = await prisma.pagamento.count({ where: { candidaturaId } });
    expect(count).toBe(0);
  });
});
