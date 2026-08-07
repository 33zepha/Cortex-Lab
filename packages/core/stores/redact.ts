/** Redaction des secrets à l'écriture (DECISIONS.md #6, ARCHITECTURE.md § sécurité). */
const SECRET_PATTERNS: [RegExp, string][] = [
  [/sk-[a-zA-Z0-9]{20,}/g, "[REDACTED_KEY]"],
  [/-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]+?-----END [A-Z ]+PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]"],
  [/(Authorization:\s*Bearer\s+)[A-Za-z0-9\-_.]+/gi, "$1[REDACTED]"],
  [/("?(?:api[_-]?key|token|password|secret)"?\s*[:=]\s*"?)([^",\s]+)/gi, "$1[REDACTED]"],
];

function redactString(value: string): string {
  return SECRET_PATTERNS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), value);
}

export function redactSecrets(input: unknown): unknown {
  if (typeof input === "string") return redactString(input);
  if (typeof input !== "object" || input === null) return input;
  if (Array.isArray(input)) return input.map(redactSecrets);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    out[key] = redactSecrets(value);
  }
  return out;
}
