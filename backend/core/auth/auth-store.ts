import { promises as fs } from "node:fs";
import path from "node:path";
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { ulid } from "ulid";

const scrypt = promisify(scryptCallback);

export type AuthConnection =
  | { type: "vps"; host: string; user: string }
  | { type: "api"; origin: string };

export type WorkspaceRecord = {
  id: string;
  ownerUserId: string;
  name: string;
  connections: AuthConnection[];
  createdAt: number;
};

type StoredUser = {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  workspaceId: string;
  createdAt: number;
};

export type AuthSession = {
  userId: string;
  user: string;
  expiresAt: number;
};

type SignupInput = {
  email: string;
  password: string;
  workspaceName: string;
  connections: AuthConnection[];
};

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function parseSessionCookie(cookieHeader: string | undefined): string | null {
  const token = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("cortex_session="))
    ?.slice("cortex_session=".length);
  return token ? decodeURIComponent(token) : null;
}

export function signSession(userId: string, user: string, expiresAt: number, secret: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, user, expiresAt }), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySession(token: string | null, secret: string): AuthSession | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (!safeEqual(signature, expected)) return null;

  const session = parseJson<Partial<AuthSession>>(Buffer.from(payload, "base64url").toString("utf8"), {});
  if (typeof session.userId !== "string" || typeof session.user !== "string" || typeof session.expiresAt !== "number") return null;
  if (!Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) return null;
  return { userId: session.userId, user: session.user, expiresAt: session.expiresAt };
}

export function sessionCookie(token: string, maxAge = SESSION_TTL_SECONDS): string {
  return `cortex_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export class AuthStore {
  private readonly usersPath: string;
  private readonly workspacesPath: string;

  constructor(private readonly rootDir: string, private readonly sessionSecret: string) {
    this.usersPath = path.join(rootDir, "users.json");
    this.workspacesPath = path.join(rootDir, "workspaces.json");
  }

  async initialize(defaultAccount?: { email: string; password: string }): Promise<void> {
    await fs.mkdir(this.rootDir, { recursive: true });
    const users = await this.readUsers();
    if (users.length > 0 || !defaultAccount?.email || !defaultAccount.password) return;

    const workspaceId = ulid();
    const user: StoredUser = {
      id: ulid(),
      email: normalizeEmail(defaultAccount.email),
      passwordHash: await this.hashPassword(defaultAccount.password, randomBytes(16).toString("hex")),
      passwordSalt: "",
      workspaceId,
      createdAt: Date.now(),
    };
    // hashPassword returns salt:hash; keeping the split explicit avoids storing a raw password.
    const [passwordSalt, passwordHash] = user.passwordHash.split(":");
    user.passwordSalt = passwordSalt ?? "";
    user.passwordHash = passwordHash ?? "";
    await this.writeUsers([user]);
    await this.writeWorkspaces([{
      id: workspaceId,
      ownerUserId: user.id,
      name: "Cortex Lab",
      connections: [],
      createdAt: user.createdAt,
    }]);
  }

  async signup(input: SignupInput): Promise<{ user: AuthSession; workspace: WorkspaceRecord; sessionToken: string }> {
    const email = normalizeEmail(input.email);
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Adresse email invalide");
    if (input.password.length < 12) throw new Error("Le mot de passe doit contenir au moins 12 caractères");
    if (input.workspaceName.trim().length < 2 || input.workspaceName.trim().length > 80) throw new Error("Nom de workspace invalide");

    const users = await this.readUsers();
    if (users.some((candidate) => candidate.email === email)) throw new Error("Un compte existe déjà avec cet email");

    const connections = input.connections.filter((candidate): candidate is AuthConnection => {
      if (!candidate || typeof candidate !== "object") return false;
      const connection = candidate as Partial<AuthConnection>;
      if (connection.type === "vps") {
        return typeof connection.host === "string" && connection.host.trim().length > 0 && connection.host.length <= 255
          && typeof connection.user === "string" && connection.user.trim().length > 0 && connection.user.length <= 120;
      }
      if (connection.type === "api" && typeof connection.origin === "string") {
        if (connection.origin.length > 2_000) return false;
        try { new URL(connection.origin); return true; } catch { return false; }
      }
      return false;
    });

    const now = Date.now();
    const workspace: WorkspaceRecord = {
      id: ulid(),
      ownerUserId: ulid(),
      name: input.workspaceName.trim(),
      connections,
      createdAt: now,
    };
    const [passwordSalt, passwordHash] = (await this.hashPassword(input.password, randomBytes(16).toString("hex"))).split(":");
    const user: StoredUser = {
      id: workspace.ownerUserId,
      email,
      passwordSalt: passwordSalt ?? "",
      passwordHash: passwordHash ?? "",
      workspaceId: workspace.id,
      createdAt: now,
    };
    await this.writeUsers([...users, user]);
    await this.writeWorkspaces([...(await this.readWorkspaces()), workspace]);
    return this.createSession(user, workspace);
  }

  async authenticate(identifier: string, password: string): Promise<{ user: AuthSession; workspace: WorkspaceRecord; sessionToken: string } | null> {
    const normalized = normalizeEmail(identifier);
    const users = await this.readUsers();
    const user = users.find((candidate) => candidate.email === normalized);
    if (!user || !(await this.verifyPassword(password, user.passwordSalt, user.passwordHash))) return null;
    const workspace = (await this.readWorkspaces()).find((candidate) => candidate.id === user.workspaceId);
    if (!workspace) return null;
    return this.createSession(user, workspace);
  }

  private createSession(user: StoredUser, workspace?: WorkspaceRecord): { user: AuthSession; workspace: WorkspaceRecord; sessionToken: string } {
    const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
    const session = { userId: user.id, user: user.email, expiresAt };
    const fallbackWorkspace: WorkspaceRecord = workspace ?? {
      id: user.workspaceId,
      ownerUserId: user.id,
      name: "Cortex Lab",
      connections: [],
      createdAt: user.createdAt,
    };
    return { user: session, workspace: fallbackWorkspace, sessionToken: signSession(session.userId, session.user, session.expiresAt, this.sessionSecret) };
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    const derived = await scrypt(password, salt, 32) as Buffer;
    return `${salt}:${derived.toString("hex")}`;
  }

  private async verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
    if (!salt || !expectedHash) return false;
    const actual = await this.hashPassword(password, salt);
    return safeEqual(actual.split(":")[1] ?? "", expectedHash);
  }

  private async readUsers(): Promise<StoredUser[]> {
    const raw = await fs.readFile(this.usersPath, "utf8").catch(() => "[]");
    const value = parseJson<unknown>(raw, []);
    return Array.isArray(value) ? value as StoredUser[] : [];
  }

  private async readWorkspaces(): Promise<WorkspaceRecord[]> {
    const raw = await fs.readFile(this.workspacesPath, "utf8").catch(() => "[]");
    const value = parseJson<unknown>(raw, []);
    return Array.isArray(value) ? value as WorkspaceRecord[] : [];
  }

  private async writeUsers(users: StoredUser[]): Promise<void> {
    await fs.writeFile(this.usersPath, `${JSON.stringify(users, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  }

  private async writeWorkspaces(workspaces: WorkspaceRecord[]): Promise<void> {
    await fs.writeFile(this.workspacesPath, `${JSON.stringify(workspaces, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  }
}

export { SESSION_TTL_SECONDS };
