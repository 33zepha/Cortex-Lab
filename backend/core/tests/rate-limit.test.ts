import { describe, expect, it } from "vitest";
import { MemoryRateLimiter } from "../security/rate-limit";

describe("MemoryRateLimiter", () => {
  it("bloque après la limite puis se réarme à la fin de la fenêtre", () => {
    const limiter = new MemoryRateLimiter({ maxAttempts: 2, windowMs: 1_000 });

    expect(limiter.consume("client", 0).allowed).toBe(true);
    expect(limiter.consume("client", 1).allowed).toBe(true);
    expect(limiter.consume("client", 2)).toMatchObject({ allowed: false, retryAfterSeconds: 1 });
    expect(limiter.consume("client", 1_001).allowed).toBe(true);
  });

  it("permet de réinitialiser un client après une authentification réussie", () => {
    const limiter = new MemoryRateLimiter({ maxAttempts: 1, windowMs: 1_000 });
    limiter.consume("client", 0);
    limiter.reset("client");

    expect(limiter.consume("client", 1).allowed).toBe(true);
  });
});
