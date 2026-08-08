import { describe, expect, it } from "vitest";
import {
  buildSessionCookie,
  createSessionToken,
  getSessionSubject,
  isAcceptableSessionSecret,
  resolveSessionSecret,
  SESSION_SECRET_MIN_LENGTH,
  verifySessionToken,
} from "../auth/session";

describe("signed Cortex sessions", () => {
  it("round-trip the subject and reject tampering or expiry", () => {
    const secret = "test-session-secret";
    const expiresAt = Date.now() + 60_000;
    const token = createSessionToken("ada@example.com", expiresAt, secret);

    expect(verifySessionToken(token, secret)).toBe("ada@example.com");
    expect(verifySessionToken(token, "wrong-secret")).toBeNull();
    expect(verifySessionToken(token, secret, expiresAt + 1)).toBeNull();
    expect(getSessionSubject(`other=1; cortex_session=${encodeURIComponent(token)}`, secret)).toBe("ada@example.com");
  });

  it("builds an HttpOnly cookie and does not expose the subject in its attributes", () => {
    const cookie = buildSessionCookie("token-value", 120, true);
    expect(cookie).toContain("cortex_session=token-value");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Max-Age=120");
  });

  it("n'autorise pas un secret court en production et ne fabrique pas de fallback", () => {
    expect(isAcceptableSessionSecret("short", true)).toBe(false);
    expect(isAcceptableSessionSecret("x".repeat(SESSION_SECRET_MIN_LENGTH), true)).toBe(true);
    expect(resolveSessionSecret(undefined, true)).toBe("");
    expect(resolveSessionSecret(undefined, false)).toBeTruthy();
  });
});
