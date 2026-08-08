export type CortexSession = { authenticated: true; user: string };

export type AuthConnection =
  | { type: "vps"; host: string; user: string }
  | { type: "api"; origin: string };

export type WorkspaceSummary = {
  id: string;
  name: string;
  connections: AuthConnection[];
};

export const WORKSPACE_STORAGE_KEY = "cortex.workspace-summary";

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

export async function login(identifier: string, password: string): Promise<CortexSession> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: identifier, password }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<CortexSession>;
}

export async function signup(input: {
  email: string;
  password: string;
  workspaceName: string;
  connections: AuthConnection[];
}): Promise<CortexSession & { workspace: WorkspaceSummary }> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await parseError(response));
  const session = await response.json() as CortexSession & { workspace: WorkspaceSummary };
  if (typeof window !== "undefined" && session.workspace) {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(session.workspace));
  }
  return session;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
}
