import { describe, expect, it } from "vitest";
import { summarizeClaudeUsage } from "../adapters/claude-code-adapter";

describe("summarizeClaudeUsage", () => {
  it("n'impute pas les tokens de cache au budget actif", () => {
    const usage = summarizeClaudeUsage({
      input_tokens: 1_250,
      output_tokens: 750,
      cache_creation_input_tokens: 42_000,
      cache_read_input_tokens: 121_000,
    });

    expect(usage.activeTokens).toBe(2_000);
    expect(usage.totalContextTokens).toBe(165_000);
    expect(usage.cacheCreationInputTokens).toBe(42_000);
    expect(usage.cacheReadInputTokens).toBe(121_000);
  });

  it("normalise les champs absents ou invalides à zéro", () => {
    const usage = summarizeClaudeUsage({ input_tokens: 12.9, output_tokens: -1 });

    expect(usage).toEqual({
      activeTokens: 12,
      inputTokens: 12,
      outputTokens: 0,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
      totalContextTokens: 12,
    });
  });
});
