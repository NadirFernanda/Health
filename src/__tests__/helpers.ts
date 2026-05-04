/**
 * Test helpers: create / destroy test fixtures in the real database.
 * All entities are tagged with TEST_PREFIX so cleanup is safe and targeted.
 */
import { vi } from "vitest";
import { prisma } from "@/lib/db";
import { createSessionToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

// Unique per test run so parallel CI jobs don't collide
export const TEST_PREFIX = `__test_${Date.now()}__`;

export function testEmail(name: string) {
  return `${TEST_PREFIX}${name}@test.ao`;
}

// ---------------------------------------------------------------------------
// Fixture creators
// ---------------------------------------------------------------------------

export async function createTestMedico(label = "medico", verified = true) {
  const email = testEmail(label);
  const hash = await bcrypt.hash("Test@12345", 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      role: "MEDICO",
      profissional: {
        create: {
          nome: `Dr. Test ${label}`,
          tipo: "MEDICO",
          especialidade: "Medicina Geral",
          verified,
        },
      },
    },
    include: { profissional: true },
  });
  const token = await createSessionToken(user.id, email, "MEDICO");
  return { user, prof: user.profissional!, token };
}

export async function createTestClinica(label = "clinica") {
  const email = testEmail(label);
  const hash = await bcrypt.hash("Test@12345", 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      role: "CLINICA",
      clinica: {
        create: {
          nome: `Clínica Test ${label}`,
          cidade: "Luanda",
          provincia: "Luanda",
          verified: true,
        },
      },
    },
    include: { clinica: true },
  });
  const token = await createSessionToken(user.id, email, "CLINICA");
  return { user, clinica: user.clinica!, token };
}

export async function createTestPlantao(
  clinicaId: string,
  opts: { vagas?: number; valorKwanzas?: number } = {}
) {
  const dataInicio = new Date(Date.now() + 86_400_000); // tomorrow
  const dataFim = new Date(dataInicio.getTime() + 43_200_000); // +12h
  return prisma.plantao.create({
    data: {
      clinicaId,
      especialidade: "Medicina Geral",
      dataInicio,
      dataFim,
      valorKwanzas: opts.valorKwanzas ?? 20_000,
      vagas: opts.vagas ?? 2,
    },
  });
}

// ---------------------------------------------------------------------------
// Cookie mock helper — call this before each test that needs auth
// ---------------------------------------------------------------------------
import { cookies } from "next/headers";

export function mockAuthAs(token: string) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      name === "medfreela_session" ? { value: token } : undefined,
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(() => true),
    getAll: vi.fn(() => []),
  } as never);
}

export function mockNoAuth() {
  vi.mocked(cookies).mockResolvedValue({
    get: () => undefined,
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(() => false),
    getAll: vi.fn(() => []),
  } as never);
}

// ---------------------------------------------------------------------------
// Cleanup — delete all data created with TEST_PREFIX
// ---------------------------------------------------------------------------

export async function cleanupTestData() {
  const users = await prisma.user.findMany({
    where: { email: { contains: TEST_PREFIX } },
    select: { id: true },
  });
  if (users.length === 0) return;

  const userIds = users.map((u) => u.id);

  const [profs, clinicas] = await Promise.all([
    prisma.profissional.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    }),
    prisma.clinica.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    }),
  ]);

  const profIds = profs.map((p) => p.id);
  const clinicaIds = clinicas.map((c) => c.id);

  const plantoes = await prisma.plantao.findMany({
    where: { clinicaId: { in: clinicaIds } },
    select: { id: true },
  });
  const plantaoIds = plantoes.map((p) => p.id);

  const candidaturas = await prisma.candidatura.findMany({
    where: {
      OR: [
        { plantaoId: { in: plantaoIds } },
        { profissionalId: { in: profIds } },
      ],
    },
    select: { id: true },
  });
  const candIds = candidaturas.map((c) => c.id);

  // Delete in FK-safe order
  await prisma.pagamento.deleteMany({
    where: { OR: [{ candidaturaId: { in: candIds } }, { plantaoId: { in: plantaoIds } }] },
  });
  try {
    await prisma.mensagem.deleteMany({ where: { candidaturaId: { in: candIds } } });
  } catch { /* Mensagem table may not exist in the test DB yet */ }
  await prisma.notificacao.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.candidatura.deleteMany({ where: { id: { in: candIds } } });
  await prisma.plantao.deleteMany({ where: { id: { in: plantaoIds } } });
  await prisma.profissional.deleteMany({ where: { id: { in: profIds } } });
  await prisma.clinica.deleteMany({ where: { id: { in: clinicaIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}
