export function isLoopbackHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return normalized === "127.0.0.1" || normalized === "::1" || normalized === "localhost";
}

export function assertPublicApiSecured(options: {
  host: string;
  apiToken: string | null;
  allowUnauthenticatedPublic: boolean;
}): void {
  if (isLoopbackHost(options.host)) return;
  if (options.apiToken) return;
  if (options.allowUnauthenticatedPublic) return;

  throw new Error(
    "Refus de démarrer Cortex API sur une interface publique sans CORTEX_API_TOKEN. " +
      "Définis un token partagé ou, uniquement pour un dépannage temporaire, " +
      "CORTEX_ALLOW_UNAUTHENTICATED_PUBLIC=1.",
  );
}

export function resolveCorsOrigin(host: string, allowedOrigins: string[]): true | false | string[] {
  if (allowedOrigins.length > 0) return allowedOrigins;
  return isLoopbackHost(host) ? true : false;
}
