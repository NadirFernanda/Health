/**
 * Global test setup — runs once before each test FILE.
 *
 * Provides:
 *  - Loads .env so DATABASE_URL is available
 *  - Mocked next/headers so route handlers can be called in isolation
 *  - AUTH_SECRET env var for token generation
 *
 * Required env vars (in .env or .env.test):
 *   DATABASE_URL   — pointing to the development or dedicated test database
 *   AUTH_SECRET    — same 32+ char secret used by the app
 */
import "dotenv/config"; // loads .env → DATABASE_URL, AUTH_SECRET
import { vi } from "vitest";

// Guarantee AUTH_SECRET is available for token generation in tests.
// If already set from .env, this is a no-op.
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "medfreela_test_secret_key_for_vitest_only!!";
}

// Mock next/headers — individual test files configure the return value via vi.mocked(cookies)
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
  headers: vi.fn().mockResolvedValue(new Headers()),
}));
