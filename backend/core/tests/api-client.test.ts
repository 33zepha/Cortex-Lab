import { describe, it, expect } from "vitest";
import { ApiError, shouldRetryOnError } from "../../../src/lib/api";

describe("Frontend API Client & SWR Retry Filter (src/lib/api.ts)", () => {
  it("cree une ApiError avec status HTTP", () => {
    const err = new ApiError("Not found", 404);
    expect(err.message).toBe("Not found");
    expect(err.status).toBe(404);
  });

  it("ne retrie PAS les erreurs 4xx (400, 401, 403, 404)", () => {
    expect(shouldRetryOnError(new ApiError("Bad request", 400))).toBe(false);
    expect(shouldRetryOnError(new ApiError("Unauthorized", 401))).toBe(false);
    expect(shouldRetryOnError(new ApiError("Forbidden", 403))).toBe(false);
    expect(shouldRetryOnError(new ApiError("Not found", 404))).toBe(false);
  });

  it("retrie les erreurs 5xx et les erreurs reseau", () => {
    expect(shouldRetryOnError(new ApiError("Internal error", 500))).toBe(true);
    expect(shouldRetryOnError(new ApiError("Bad gateway", 502))).toBe(true);
    expect(shouldRetryOnError(new ApiError("Service unavailable", 503))).toBe(true);
    expect(shouldRetryOnError(new Error("Network failed"))).toBe(true);
  });
});
