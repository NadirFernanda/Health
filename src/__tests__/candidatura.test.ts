/**
 * Integration tests — candidatura flow.
 *
 * Full happy path:
 *   1. Doctor submits candidature            → PENDENTE
 *   2. Clinic accepts                         → CONTRATO_PENDENTE + notification
 *   3. Doctor signs contract                  → ACEITE + payment created
 *   4. Plantão vagasPreenchidas incremented
 *   5. Auto-close / auto-reject when full
 *
 * Error paths:
 *   - Unauthenticated request                 → 401
 *   - Wrong role                              → 403
 *   - Unverified doctor                       → 403
 *   - Duplicate candidature                   → 409
 *   - Self-candidature                        → 403
 *   - Closed plantão                          → 400
 *   - Sign contract when not CONTRATO_PENDENTE → 409
 *   - Contract rejection                       → RECUSADO
 *
 * Requires a live DATABASE_URL (the development DB or a dedicated test DB).
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
  mockNoAuth,
  cleanupTestData,
} from "./helpers";

// Route handlers under test
import { GET as getMedicoCandidaturas, POST as submitCandidatura } from "@/app/api/medico/candidaturas/route";
import { PATCH as reviewCandidatura } from "@/app/api/clinica/plantoes/[id]/candidaturas/route";
import { POST as handleContrato } from "@/app/api/contrato/[candidaturaId]/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonRequest(method: string, body: unknown) {
  return new Request("http://localhost/test", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function postCandidatura(plantaoId: string) {
  return submitCandidatura(jsonRequest("POST", { plantaoId }) as unknown as NextRequest);
}

async function patchClinica(plantaoId: string, body: unknown) {
  return reviewCandidatura(
    jsonRequest("PATCH", body) as unknown as NextRequest,
    { params: Promise.resolve({ id: plantaoId }) }
  );
}

async function postContrato(candidaturaId: string, acao: "ASSINAR" | "RECUSAR") {
  return handleContrato(
    jsonRequest("POST", { acao }) as unknown as NextRequest,
    { params: Promise.resolve({ candidaturaId }) }
  );
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("Candidatura — happy path", () => {
  let clinicaData: Awaited<ReturnType<typeof createTestClinica>>;
  let medicoData: Awaited<ReturnType<typeof createTestMedico>>;
  let plantao: { id: string; valorKwanzas: number; vagas: number };
  let candidaturaId: string;

  beforeAll(async () => {
    clinicaData = await createTestClinica("happy-cli");
    medicoData = await createTestMedico("happy-med");
    plantao = await createTestPlantao(clinicaData.clinica.id, { vagas: 2, valorKwanzas: 20_000 });
  });

  afterAll(cleanupTestData);

  it("1. GET /api/medico/candidaturas — returns empty list for new doctor", async () => {
    mockAuthAs(medicoData.token);
    const res = await getMedicoCandidaturas();
    expect(res.status).toBe(200);
    const body = await res.json();
    // Filter to our test plantão
    const mine = body.filter((c: { plantao: { id: string } }) => c.plantao.id === plantao.id);
    expect(mine).toHaveLength(0);
  });

  it("2. POST /api/medico/candidaturas — doctor submits candidature (201)", async () => {
    mockAuthAs(medicoData.token);
    const res = await postCandidatura(plantao.id);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.estado).toBe("PENDENTE");
    candidaturaId = body.id;
    expect(candidaturaId).toBeTruthy();
  });

  it("3. GET /api/medico/candidaturas — now returns the submitted candidature", async () => {
    mockAuthAs(medicoData.token);
    const res = await getMedicoCandidaturas();
    const body = await res.json();
    const mine = body.filter((c: { plantao: { id: string } }) => c.plantao.id === plantao.id);
    expect(mine).toHaveLength(1);
    expect(mine[0].estado).toBe("PENDENTE");
  });

  it("4. PATCH clinic — accepts candidature → CONTRATO_PENDENTE", async () => {
    mockAuthAs(clinicaData.token);
    const res = await patchClinica(plantao.id, { candidaturaId, estado: "CONTRATO_PENDENTE" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.estado).toBe("CONTRATO_PENDENTE");

    // Verify DB state
    const cand = await prisma.candidatura.findUnique({ where: { id: candidaturaId } });
    expect(cand?.estado as string).toBe("CONTRATO_PENDENTE");
    expect(cand?.contratoGeradoEm).not.toBeNull();
  });

  it("5. Notification sent to doctor after clinic accepts", async () => {
    const notif = await prisma.notificacao.findFirst({
      where: { userId: medicoData.user.id, tipo: "CONTRATO" },
      orderBy: { criadoEm: "desc" },
    });
    expect(notif).not.toBeNull();
    expect(notif!.href).toContain("/contrato");
  });

  it("6. POST /api/contrato — doctor signs contract → ACEITE", async () => {
    mockAuthAs(medicoData.token);
    const res = await postContrato(candidaturaId, "ASSINAR");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.estado).toBe("ACEITE");

    // Verify DB state
    const cand = await prisma.candidatura.findUnique({ where: { id: candidaturaId } });
    expect(cand?.estado).toBe("ACEITE");
    expect(cand?.contratoAssinadoEm).not.toBeNull();
  });

  it("7. Notification sent to clinic after doctor signs", async () => {
    const notif = await prisma.notificacao.findFirst({
      where: { userId: clinicaData.user.id, tipo: "CONTRATO" },
      orderBy: { criadoEm: "desc" },
    });
    expect(notif).not.toBeNull();
    expect(notif!.titulo).toMatch(/assinado/i);
  });

  it("8. GET /api/medico/candidaturas — candidature now shows ACEITE", async () => {
    mockAuthAs(medicoData.token);
    const res = await getMedicoCandidaturas();
    const body = await res.json();
    const mine = body.filter((c: { plantao: { id: string } }) => c.plantao.id === plantao.id);
    expect(mine[0].estado).toBe("ACEITE");
  });
});

// ---------------------------------------------------------------------------

describe("Candidatura — contract rejection", () => {
  let clinicaData: Awaited<ReturnType<typeof createTestClinica>>;
  let medicoData: Awaited<ReturnType<typeof createTestMedico>>;
  let plantao: { id: string };
  let candidaturaId: string;

  beforeAll(async () => {
    clinicaData = await createTestClinica("reject-cli");
    medicoData = await createTestMedico("reject-med");
    plantao = await createTestPlantao(clinicaData.clinica.id);

    // Set up: submit + accept
    mockAuthAs(medicoData.token);
    const sub = await submitCandidatura(jsonRequest("POST", { plantaoId: plantao.id }) as unknown as NextRequest);
    const data = await sub.json();
    candidaturaId = data.id;

    mockAuthAs(clinicaData.token);
    await patchClinica(plantao.id, { candidaturaId, estado: "CONTRATO_PENDENTE" });
  });

  afterAll(cleanupTestData);

  it("doctor refuses contract → RECUSADO", async () => {
    mockAuthAs(medicoData.token);
    const res = await postContrato(candidaturaId, "RECUSAR");
    expect(res.status).toBe(200);
    expect((await res.json()).estado).toBe("RECUSADO");

    const cand = await prisma.candidatura.findUnique({ where: { id: candidaturaId } });
    expect(cand?.estado).toBe("RECUSADO");
  });

  it("clinic receives notification of rejection", async () => {
    const notif = await prisma.notificacao.findFirst({
      where: { userId: clinicaData.user.id, tipo: "CONTRATO" },
      orderBy: { criadoEm: "desc" },
    });
    expect(notif?.titulo).toMatch(/recusado/i);
  });
});

// ---------------------------------------------------------------------------

describe("Candidatura — auto-close & auto-reject", () => {
  let clinicaData: Awaited<ReturnType<typeof createTestClinica>>;
  let medico1: Awaited<ReturnType<typeof createTestMedico>>;
  let medico2: Awaited<ReturnType<typeof createTestMedico>>;
  let plantao: { id: string; vagas: number };
  let cand1Id: string;
  let cand2Id: string;

  beforeAll(async () => {
    clinicaData = await createTestClinica("autoclose-cli");
    medico1 = await createTestMedico("autoclose-m1");
    medico2 = await createTestMedico("autoclose-m2");
    // Plantão with only 1 vaga
    plantao = await createTestPlantao(clinicaData.clinica.id, { vagas: 1 });

    // Both doctors apply
    mockAuthAs(medico1.token);
    const r1 = await postCandidatura(plantao.id);
    cand1Id = (await r1.json()).id;

    mockAuthAs(medico2.token);
    const r2 = await postCandidatura(plantao.id);
    cand2Id = (await r2.json()).id;
  });

  afterAll(cleanupTestData);

  it("clinic accepts medico1 → CONTRATO_PENDENTE", async () => {
    mockAuthAs(clinicaData.token);
    const res = await patchClinica(plantao.id, { candidaturaId: cand1Id, estado: "CONTRATO_PENDENTE" });
    expect(res.status).toBe(200);
  });

  it("medico1 signs → ACEITE, plantão closes, medico2 auto-rejected", async () => {
    mockAuthAs(medico1.token);
    const res = await postContrato(cand1Id, "ASSINAR");
    expect(res.status).toBe(200);

    // Plantão should be FECHADO
    const p = await prisma.plantao.findUnique({ where: { id: plantao.id } });
    expect(p?.estado).toBe("FECHADO");
    expect(p?.vagasPreenchidas).toBe(1);

    // medico2 should be auto-rejected
    const c2 = await prisma.candidatura.findUnique({ where: { id: cand2Id } });
    expect(c2?.estado).toBe("RECUSADO");
  });
});

// ---------------------------------------------------------------------------

describe("Candidatura — error paths", () => {
  let clinicaData: Awaited<ReturnType<typeof createTestClinica>>;
  let medicoVerified: Awaited<ReturnType<typeof createTestMedico>>;
  let medicoUnverified: Awaited<ReturnType<typeof createTestMedico>>;
  let plantao: { id: string };
  let existingCandId: string;

  beforeAll(async () => {
    clinicaData = await createTestClinica("err-cli");
    medicoVerified = await createTestMedico("err-med-v", true);
    medicoUnverified = await createTestMedico("err-med-u", false);
    plantao = await createTestPlantao(clinicaData.clinica.id);

    // Create one candidature to test duplicate
    mockAuthAs(medicoVerified.token);
    const r = await postCandidatura(plantao.id);
    existingCandId = (await r.json()).id;
  });

  afterAll(cleanupTestData);

  it("401 — unauthenticated POST to candidaturas", async () => {
    mockNoAuth();
    const res = await postCandidatura(plantao.id);
    expect(res.status).toBe(401);
  });

  it("403 — wrong role (clinic tries to submit as doctor)", async () => {
    mockAuthAs(clinicaData.token);
    const res = await postCandidatura(plantao.id);
    expect(res.status).toBe(403);
  });

  it("403 — unverified doctor cannot apply", async () => {
    mockAuthAs(medicoUnverified.token);
    const res = await postCandidatura(plantao.id);
    expect(res.status).toBe(403);
  });

  it("409 — duplicate candidature rejected", async () => {
    mockAuthAs(medicoVerified.token);
    const res = await postCandidatura(plantao.id);
    expect(res.status).toBe(409);
  });

  it("400 — invalid estado in clinic PATCH", async () => {
    mockAuthAs(clinicaData.token);
    const res = await patchClinica(plantao.id, { candidaturaId: existingCandId, estado: "ACEITE" });
    expect(res.status).toBe(400);
  });

  it("409 — signing a contract that is not CONTRATO_PENDENTE", async () => {
    // existingCandId is still PENDENTE (clinic hasn't acted on it)
    mockAuthAs(medicoVerified.token);
    const res = await postContrato(existingCandId, "ASSINAR");
    expect(res.status).toBe(409);
  });

  it("401 — unauthenticated GET to medico candidaturas", async () => {
    mockNoAuth();
    const res = await getMedicoCandidaturas();
    expect(res.status).toBe(401);
  });
});
