export type TokenCategory = "input" | "output" | "reasoning" | "cache";
export type TimePeriod = "today" | "7d" | "30d";

export interface TokenBreakdown {
  input: number;
  output: number;
  reasoning: number;
  cache: number;
}

export interface AgentUsage {
  agent: string;
  model: string;
  tokens: number;
  percentage: number;
  category: TokenCategory;
}

export interface TokenUsageData {
  total: number;
  today: number;
  growthPercent: number;
  categories: TokenBreakdown;
  agents: AgentUsage[];
}
