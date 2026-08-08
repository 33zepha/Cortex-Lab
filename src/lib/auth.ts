export type CortexSession = { authenticated: true; user: string; workspace?: unknown | null };

async function parseError(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({})) as { error?: string };
  return body.error || `Authentication failed (${response.status})`;
}

export async function getSession(): Promise<CortexSession | null> {
  const response = await fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<CortexSession>;
}

export async function login(username: string, password: string): Promise<CortexSession> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<CortexSession>;
}

export async function register(email: string, password: string, workspaceName: string): Promise<CortexSession> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, workspaceName }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<CortexSession>;
}

export async function logout(): Promise<void> {
  const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin", cache: "no-store" });
  if (!response.ok) throw new Error(await parseError(response));
}
