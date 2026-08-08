import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { AuthStore, parseSessionCookie, signSession, verifySession } from "../auth/auth-store";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

async function createStore(): Promise<{ store: AuthStore; directory: string }> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "cortex-auth-test-"));
  tempDirs.push(directory);
  return { store: new AuthStore(directory, "test-session-secret"), directory };
}

describe("AuthStore", () => {
  it("seeds and authenticates the configured operator account", async () => {
    const { store } = await createStore();
    await store.initialize({ email: "boss", password: "local-password" });

    const result = await store.authenticate("boss", "local-password");
    expect(result?.user.user).toBe("boss");
    expect(result?.workspace.name).toBe("Cortex Lab");
    expect(verifySession(result?.sessionToken ?? null, "test-session-secret")?.user).toBe("boss");
  });

  it("creates a persistent account and workspace without storing the password", async () => {
    const { store, directory } = await createStore();
    await store.initialize();

    const result = await store.signup({
      email: "operator@example.com",
      password: "a-long-enough-password",
      workspaceName: "North Star",
      connections: [{ type: "vps", host: "100.85.93.10", user: "root" }],
    });

    expect(result.workspace.name).toBe("North Star");
    expect(result.workspace.connections).toHaveLength(1);
    expect((await store.authenticate("operator@example.com", "a-long-enough-password"))?.user.user).toBe("operator@example.com");
    expect(await store.authenticate("operator@example.com", "wrong-password")).toBeNull();

    const usersFile = await fs.readFile(path.join(directory, "users.json"), "utf8");
    expect(usersFile).not.toContain("a-long-enough-password");
  });

  it("accepts the cookie value produced by the session helper", () => {
    const token = signSession("user_1", "operator@example.com", Date.now() + 30_000, "test-session-secret");
    expect(parseSessionCookie(`other=1; cortex_session=${encodeURIComponent(token)}`)).toBe(token);
  });
});
