import { describe, expect, it } from "vitest";
import { assertPublicApiSecured, isLoopbackHost, resolveCorsOrigin } from "../security/runtime-security";

describe("runtime security", () => {
  it("reconnaît les hôtes loopback", () => {
    expect(isLoopbackHost("127.0.0.1")).toBe(true);
    expect(isLoopbackHost("::1")).toBe(true);
    expect(isLoopbackHost("localhost")).toBe(true);
    expect(isLoopbackHost("0.0.0.0")).toBe(false);
  });

  it("refuse une écoute publique sans token", () => {
    expect(() => assertPublicApiSecured({
      host: "0.0.0.0",
      apiToken: null,
      allowUnauthenticatedPublic: false,
    })).toThrow(/sans CORTEX_API_TOKEN/);
  });

  it("autorise une écoute publique avec token", () => {
    expect(() => assertPublicApiSecured({
      host: "0.0.0.0",
      apiToken: "secret",
      allowUnauthenticatedPublic: false,
    })).not.toThrow();
  });

  it("désactive CORS par défaut sur une API publique", () => {
    expect(resolveCorsOrigin("0.0.0.0", [])).toBe(false);
    expect(resolveCorsOrigin("127.0.0.1", [])).toBe(true);
    expect(resolveCorsOrigin("0.0.0.0", ["https://cortexlab.online"])).toEqual(["https://cortexlab.online"]);
  });
});
