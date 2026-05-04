/**
 * Unit tests — authentication crypto layer.
 * No database, no Next.js runtime required.
 */
import { describe, it, expect, beforeAll } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
  getPayloadFromToken,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
} from "@/lib/auth";

// AUTH_SECRET is set in setup.ts
const VALID_ID = "cuid_test_user_001";
const VALID_EMAIL = "test@medfreela.ao";

describe("Token generation", () => {
  it("creates a token with three sections: payload.sig", async () => {
    const token = await createSessionToken(VALID_ID, VALID_EMAIL, "MEDICO");
    const parts = token.split(".");
    // payload is base64url, sig is 64-char hex
    expect(parts).toHaveLength(2);
    expect(parts[1]).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(parts[1])).toBe(true);
  });

  it("embeds id, email and role in the payload", async () => {
    const token = await createSessionToken(VALID_ID, VALID_EMAIL, "CLINICA");
    const payload = getPayloadFromToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.id).toBe(VALID_ID);
    expect(payload!.sub).toBe(VALID_EMAIL);
    expect(payload!.role).toBe("CLINICA");
  });

  it("two tokens created at different times have different signatures", async () => {
    const t1 = await createSessionToken(VALID_ID, VALID_EMAIL, "MEDICO");
    await new Promise((r) => setTimeout(r, 5)); // ensure different iat
    const t2 = await createSessionToken(VALID_ID, VALID_EMAIL, "MEDICO");
    expect(t1).not.toBe(t2);
  });

  it("throws when AUTH_SECRET is too short", async () => {
    const original = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = "short";
    await expect(createSessionToken(VALID_ID, VALID_EMAIL, "MEDICO")).rejects.toThrow(
      /AUTH_SECRET/
    );
    process.env.AUTH_SECRET = original;
  });
});

describe("Token verification", () => {
  it("returns true for a valid token", async () => {
    const token = await createSessionToken(VALID_ID, VALID_EMAIL, "MEDICO");
    expect(await verifySessionToken(token)).toBe(true);
  });

  it("returns false when signature is tampered", async () => {
    const token = await createSessionToken(VALID_ID, VALID_EMAIL, "MEDICO");
    const tampered = token.slice(0, -4) + "0000";
    expect(await verifySessionToken(tampered)).toBe(false);
  });

  it("returns false when payload is modified", async () => {
    const token = await createSessionToken(VALID_ID, VALID_EMAIL, "MEDICO");
    const [payload, sig] = token.split(".");
    // Flip a char in the base64url payload
    const bad = payload.slice(0, -1) + (payload.at(-1) === "A" ? "B" : "A");
    expect(await verifySessionToken(`${bad}.${sig}`)).toBe(false);
  });

  it("returns false for an empty string", async () => {
    expect(await verifySessionToken("")).toBe(false);
  });

  it("returns false for a token without dot separator", async () => {
    expect(await verifySessionToken("nodottoken")).toBe(false);
  });

  it("returns false when signature is wrong length", async () => {
    const token = await createSessionToken(VALID_ID, VALID_EMAIL, "MEDICO");
    const [payload] = token.split(".");
    expect(await verifySessionToken(`${payload}.badhex`)).toBe(false);
  });
});

describe("Payload extraction", () => {
  it("returns null for malformed token", () => {
    expect(getPayloadFromToken("invalid")).toBeNull();
    expect(getPayloadFromToken("")).toBeNull();
  });

  it("returns null when required fields are missing", () => {
    // Craft a token without 'role'
    const partial = btoa(JSON.stringify({ id: "x", sub: "x@x.ao" }))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    expect(getPayloadFromToken(`${partial}.deadbeef`)).toBeNull();
  });
});

describe("Auth constants", () => {
  it("cookie name is medfreela_session", () => {
    expect(COOKIE_NAME).toBe("medfreela_session");
  });

  it("session lifetime is 8 hours", () => {
    expect(COOKIE_MAX_AGE).toBe(60 * 60 * 8);
  });
});
