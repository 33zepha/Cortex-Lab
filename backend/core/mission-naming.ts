/**
 * Cortex Mission Naming & Natural Dynamic Summarizer (Backend Core)
 */

export interface MissionTitleOptions {
  maxLength?: number;
  preset?: "badge" | "row" | "card" | "hero" | "sidecar" | "full";
}

const PRESET_LENGTHS: Record<NonNullable<MissionTitleOptions["preset"]>, number> = {
  badge: 32,
  sidecar: 36,
  row: 58,
  card: 68,
  hero: 84,
  full: 140,
};

const NOISE_PREFIX_PATTERNS = [
  /^(?:objectif|demande|task|tâche|tache|consigne|todo|prompt)\s*[:：-]\s*/iu,
  /^(?:ex|exemple)\s*[:：-]\s*/iu,
  /^(?:#+\s*|\*\*\s*|[-*•]\s*)/u,
  /^(?:\/plan|\/goal|\/execute|\/run)\s+/iu,
];

const CLAUSE_CONNECTORS = [
  " et ",
  " pour ",
  " afin de ",
  " avec ",
  " sans ",
  " en ",
  " mais ",
  " via ",
  " and ",
  " to ",
  " with ",
  " by ",
  " for ",
  " using ",
];

export function cleanRawObjective(raw: string): string {
  if (!raw) return "";
  let text = raw.trim();

  let modified = true;
  while (modified) {
    modified = false;
    for (const pattern of NOISE_PREFIX_PATTERNS) {
      if (pattern.test(text)) {
        text = text.replace(pattern, "").trim();
        modified = true;
      }
    }
  }

  text = text.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  return text;
}

export function extractPrimaryIntent(text: string): string {
  const cleaned = cleanRawObjective(text);
  if (!cleaned) return "";

  const sentences = cleaned.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length > 0) {
    const first = sentences[0];
    if (first) {
      return first.replace(/[.:;]+$/, "").trim();
    }
  }

  return cleaned;
}

export function compactToNaturalBoundary(text: string, maxLength: number): string {
  const clean = text.trim();
  if (clean.length <= maxLength) {
    return clean;
  }

  const punctuationRegex = /[,;—–:-]\s+/g;
  let match: RegExpExecArray | null;
  let bestPunctuationIndex = -1;

  while ((match = punctuationRegex.exec(clean)) !== null) {
    if (match.index >= 12 && match.index <= maxLength) {
      bestPunctuationIndex = match.index;
    }
  }

  if (bestPunctuationIndex > 0) {
    return clean.slice(0, bestPunctuationIndex).trim();
  }

  for (const connector of CLAUSE_CONNECTORS) {
    const connectorIdx = clean.toLowerCase().lastIndexOf(connector, maxLength);
    if (connectorIdx >= 14 && connectorIdx <= maxLength) {
      return clean.slice(0, connectorIdx).trim();
    }
  }

  const lastSpaceIdx = clean.lastIndexOf(" ", maxLength);
  if (lastSpaceIdx > 10) {
    return clean.slice(0, lastSpaceIdx).trim();
  }

  return clean.slice(0, maxLength).trim();
}

export function formatMissionTitle(
  rawObjective: string,
  options?: MissionTitleOptions,
): string {
  if (!rawObjective) return "Mission";

  const preset = options?.preset ?? "card";
  const maxLength = options?.maxLength ?? PRESET_LENGTHS[preset] ?? 54;

  const intent = extractPrimaryIntent(rawObjective);
  if (!intent) return "Mission";

  if (intent.length <= maxLength) {
    return intent;
  }

  const compacted = compactToNaturalBoundary(intent, maxLength);
  return compacted;
}

export interface MissionDisplayInfo {
  title: string;
  subtitle?: string;
  fullObjective: string;
  isSummarized: boolean;
}

export function getMissionDisplay(
  mission: { title?: string; objective: string; constraints?: string },
  options?: MissionTitleOptions,
): MissionDisplayInfo {
  const fullObjective = cleanRawObjective(mission.objective);
  const explicitTitle = mission.title?.trim();

  const title = explicitTitle || formatMissionTitle(fullObjective, options);
  const isSummarized = title.length < fullObjective.length;

  let subtitle: string | undefined;
  if (mission.constraints?.trim()) {
    subtitle = mission.constraints.trim();
  } else if (isSummarized && fullObjective.length > title.length + 15) {
    const remaining = fullObjective.slice(title.length).replace(/^[,:;\s—–-]+/, "").trim();
    if (remaining.length > 5) {
      subtitle = remaining;
    }
  }

  return {
    title,
    subtitle,
    fullObjective,
    isSummarized,
  };
}
