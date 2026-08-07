export type TokenCategory = "input" | "output" | "reasoning" | "cache";

export interface TokenSegment {
  id: string;
  startToken: number;
  endToken: number;
  mission: string;
  agent: string;
  model: string;
  category: TokenCategory;
  timestamp: string;
}

export interface TokenMatterData {
  total: number;
  today: number;
  capacity: number; // Ex: 1_048_576 pour 64x64
  categories: {
    input: number;
    output: number;
    reasoning: number;
    cache: number;
  };
  segments: TokenSegment[];
}

export interface HilbertPoint {
  x: number;
  y: number;
  d: number;
}
