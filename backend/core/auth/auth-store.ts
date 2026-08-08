import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const scryptAsync = (
  password: string,
  salt: string,
  keyLength: number,
): Promise<Buffer> => new Promise((resolve, reject) => {
  scryptCallback(
    password,
    salt,
    keyLength,
    { N: 16_384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 },
    (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    },
  );
});

export const WorkspaceConnectionSchema = z.union([
  z.object({
    type: z.literal("vps"),
    host: z.string().trim().min(1).max(255).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, "invalid VPS host"),
    user: z.string().trim().min(1).max(64).regex(/^[A-Za-z_][A-Za-z0-9_-]*$/, "invalid SSH user"),
  }),
  z.object({
    type: z.literal("api"),
    origin: z.string().trim().url().max(2_048).refine((value) => {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    }, "origin must use http or https"),
  }),
]);

export const SignupInputSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(200),
  workspaceName: z.string().trim().min(1).max(80),
});

export const WorkspaceUpdateInputSchema = z.object({
  workspaceName: z.string().trim().min(1).max(80),
  connection: WorkspaceConnectionSchema.nullable(),
});

export type WorkspaceConnection = z.infer<typeof WorkspaceConnectionSchema> | null;
export type SignupInput = z.infer<typeof SignupInputSchema>;
export type WorkspaceUpdateInput = z.infer<typeof WorkspaceUpdateInputSchema>;

const StoredUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  passwordHash: z.string().min(1),
  createdAt: z.number().finite(),
});

const StoredWorkspaceSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  name: z.string().min(1).max(80),
  connection: WorkspaceConnectionSchema.nullable(),
  createdAt: z.number().finite(),
  updatedAt: z.number().finite(),
});

const AuthDatabaseSchema = z.object({
  version: z.literal(1),
  users: z.array(StoredUserSchema),
  workspaces: z.array(StoredWorkspaceSchema),
});

type AuthDatabase = z.infer<typeof AuthDatabaseSchema>;
type StoredUser = z.infer<typeof StoredUserSchema>;
type StoredWorkspace = z.infer<typeof StoredWorkspaceSchema>;

export type PublicUser = {
  email: string;
  createdAt: number;
};

export type PublicWorkspace = {
  id: string;
  name: string;
  connection: WorkspaceConnection;
  createdAt: number;
  updatedAt: number;
};

export class AuthStoreError extends Error {
  constructor(public readonly code: "account_exists" | "account_not_found" | "store_invalid", message: string) {
    super(message);
    this.name = "AuthStoreError";
  }
}

const EMPTY_DATABASE: AuthDatabase = { version: 1, users: [], workspaces: [] };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `scrypt-v1$16384$8$1$${salt}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, rawN, rawR, rawP, salt, expectedHex] = encoded.split("$");
  if (algorithm !== "scrypt-v1" || rawN !== "16384" || rawR !== "8" || rawP !== "1" || !salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, "hex");
  if (expected.length === 0) return false;
  const derivedKey = await scryptAsync(password, salt, expected.length);
  return derivedKey.length === expected.length && timingSafeEqual(derivedKey, expected);
}

function toPublicUser(user: StoredUser): PublicUser {
  return { email: user.email, createdAt: user.createdAt };
}

function toPublicWorkspace(workspace: StoredWorkspace): PublicWorkspace {
  return {
    id: workspace.id,
    name: workspace.name,
    connection: workspace.connection,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
}

export class AuthStore {
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async register(input: SignupInput): Promise<{ user: PublicUser; workspace: PublicWorkspace }> {
    const validated = SignupInputSchema.parse(input);
    return this.mutate(async (database) => {
      const email = normalizeEmail(validated.email);
      if (database.users.some((user) => user.email === email)) {
        throw new AuthStoreError("account_exists", "An account already exists for this email");
      }

      const now = Date.now();
      const user: StoredUser = {
        id: createId("usr"),
        email,
        passwordHash: await hashPassword(validated.password),
        createdAt: now,
      };
      const workspace: StoredWorkspace = {
        id: createId("ws"),
        ownerId: user.id,
        name: validated.workspaceName.trim(),
        connection: null,
        createdAt: now,
        updatedAt: now,
      };

      database.users.push(user);
      database.workspaces.push(workspace);
      return { user: toPublicUser(user), workspace: toPublicWorkspace(workspace) };
    });
  }

  async authenticate(identifier: string, password: string): Promise<PublicUser | null> {
    const email = normalizeEmail(identifier);
    const database = await this.read();
    const user = database.users.find((candidate) => candidate.email === email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) return null;
    return toPublicUser(user);
  }

  async findUser(identifier: string): Promise<PublicUser | null> {
    const email = normalizeEmail(identifier);
    const database = await this.read();
    const user = database.users.find((candidate) => candidate.email === email);
    return user ? toPublicUser(user) : null;
  }

  async getWorkspace(identifier: string): Promise<PublicWorkspace | null> {
    const email = normalizeEmail(identifier);
    const database = await this.read();
    const user = database.users.find((candidate) => candidate.email === email);
    if (!user) return null;
    const workspace = database.workspaces.find((candidate) => candidate.ownerId === user.id);
    return workspace ? toPublicWorkspace(workspace) : null;
  }

  async updateWorkspace(identifier: string, input: WorkspaceUpdateInput): Promise<PublicWorkspace | null> {
    const validated = WorkspaceUpdateInputSchema.parse(input);
    const email = normalizeEmail(identifier);
    return this.mutate(async (database) => {
      const user = database.users.find((candidate) => candidate.email === email);
      if (!user) return null;
      const workspace = database.workspaces.find((candidate) => candidate.ownerId === user.id);
      if (!workspace) return null;

      workspace.name = validated.workspaceName.trim();
      workspace.connection = validated.connection
        ? validated.connection.type === "api"
          ? { type: "api", origin: validated.connection.origin.replace(/\/$/, "") }
          : { type: "vps", host: validated.connection.host, user: validated.connection.user }
        : null;
      workspace.updatedAt = Date.now();
      return toPublicWorkspace(workspace);
    });
  }

  private async read(): Promise<AuthDatabase> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = AuthDatabaseSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) throw new AuthStoreError("store_invalid", "Cortex auth store is invalid");
      return parsed.data;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { ...EMPTY_DATABASE, users: [], workspaces: [] };
      if (error instanceof AuthStoreError) throw error;
      throw error;
    }
  }

  private async write(database: AuthDatabase): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    const temporaryPath = `${this.filePath}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(database, null, 2), { encoding: "utf8", mode: 0o600 });
    await fs.rename(temporaryPath, this.filePath);
  }

  private async mutate<T>(operation: (database: AuthDatabase) => Promise<T>): Promise<T> {
    const result = this.writeQueue.then(async () => {
      const database = await this.read();
      const value = await operation(database);
      await this.write(database);
      return value;
    });
    this.writeQueue = result.then(() => undefined, () => undefined);
    return result;
  }
}
