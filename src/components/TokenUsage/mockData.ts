import type { TokenUsageData, TimePeriod } from "./types";

export const PERIOD_DATA: Record<TimePeriod, TokenUsageData> = {
  "today": {
    total: 12841,
    today: 12841,
    growthPercent: 8.2,
    categories: {
      input: 8420,
      output: 2180,
      reasoning: 1740,
      cache: 501,
    },
    agents: [
      { agent: "CORTEX-ORCHESTRATOR", model: "Cortex-Core v2.4", tokens: 5900, percentage: 46.0, category: "input" },
      { agent: "CLAUDE-SONNET", model: "Claude 3.5 Sonnet", tokens: 3950, percentage: 30.8, category: "output" },
      { agent: "AG-CODEX", model: "GPT-5.6", tokens: 2991, percentage: 23.2, category: "reasoning" },
    ],
  },
  "7d": {
    total: 184392,
    today: 12841,
    growthPercent: 8.2,
    categories: {
      input: 121084,
      output: 31203,
      reasoning: 24910,
      cache: 7195,
    },
    agents: [
      { agent: "AG-CODEX", model: "GPT-5.6", tokens: 82400, percentage: 44.7, category: "input" },
      { agent: "CORTEX-ORCHESTRATOR", model: "Cortex-Core v2.4", tokens: 51200, percentage: 27.8, category: "input" },
      { agent: "CLAUDE-SONNET", model: "Claude 3.5 Sonnet", tokens: 31203, percentage: 16.9, category: "output" },
      { agent: "KIMI-EXPLORER", model: "Kimi-v1.5", tokens: 19589, percentage: 10.6, category: "reasoning" },
    ],
  },
  "30d": {
    total: 742180,
    today: 12841,
    growthPercent: 14.6,
    categories: {
      input: 486120,
      output: 125430,
      reasoning: 100200,
      cache: 30430,
    },
    agents: [
      { agent: "AG-CODEX", model: "GPT-5.6", tokens: 340000, percentage: 45.8, category: "input" },
      { agent: "CORTEX-ORCHESTRATOR", model: "Cortex-Core v2.4", tokens: 210000, percentage: 28.3, category: "input" },
      { agent: "CLAUDE-SONNET", model: "Claude 3.5 Sonnet", tokens: 125430, percentage: 16.9, category: "output" },
      { agent: "KIMI-EXPLORER", model: "Kimi-v1.5", tokens: 66750, percentage: 9.0, category: "reasoning" },
    ],
  },
};
