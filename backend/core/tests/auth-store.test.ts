import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AuthStore, AuthStoreError } from "../auth/auth-store";

describe("AuthStore", () => {
  let temporaryDirectory = "";
  let store: AuthStore;

  beforeEach(async () => {
    temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "cortex-auth-store-"));
    store = new AuthStore(path.join(temporaryDirectory, "accounts.json"));
  });

  afterEach(async () => {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  });

  it("hashes passwords and persists an isolated workspace", async () => {
    const created = await store.register({
      email: "Ada@Example.com",
      password: "correct horse battery staple",
      workspaceName: "Operations",
    });

    expect(created.user.email).toBe("ada@example.com");
    expect(created.workspace.name).toBe("Operations");
    expect(created.workspace.connection).toBeNull();
    expect(await store.authenticate("ada@example.com", "correct horse battery staple")).toEqual(created.user);
    expect(await store.authenticate("ada@example.com", "wrong password")).toBeNull();

    const raw = await fs.readFile(path.join(temporaryDirectory, "accounts.json"), "utf8");
    expect(raw).not.toContain("correct horse battery staple");
    expect(raw).toContain("scrypt-v1$");
  });

  it("rejects duplicate accounts without overwriting the first workspace", async () => {
    await store.register({ email: "owner@example.com", password: "a secure password 123", workspaceName: "First" });

    await expect(
      store.register({ email: "OWNER@example.com", password: "another secure password", workspaceName: "Second" }),
    ).rejects.toMatchObject({ code: "account_exists" } satisfies Partial<AuthStoreError>);

    expect((await store.getWorkspace("owner@example.com"))?.name).toBe("First");
  });

  it("stores only the safe connection metadata", async () => {
    await store.register({ email: "owner@example.com", password: "a secure password 123", workspaceName: "First" });

    const updated = await store.updateWorkspace("owner@example.com", {
      workspaceName: "Runtime",
      connection: { type: "vps", host: "100.85.93.10", user: "root" },
    });

    expect(updated).toMatchObject({
      name: "Runtime",
      connection: { type: "vps", host: "100.85.93.10", user: "root" },
    });
    expect(JSON.stringify(updated)).not.toMatch(/password|private|secret|key/i);
  });

  it("refuse les hôtes et utilisateurs SSH ambigus", async () => {
    await store.register({ email: "owner@example.com", password: "a secure password 123", workspaceName: "First" });

    await expect(store.updateWorkspace("owner@example.com", {
      workspaceName: "Runtime",
      connection: { type: "vps", host: "100.85.93.10; rm -rf /", user: "root" },
    })).rejects.toThrow();

    await expect(store.updateWorkspace("owner@example.com", {
      workspaceName: "Runtime",
      connection: { type: "vps", host: "100.85.93.10", user: "root@host" },
    })).rejects.toThrow();
  });
});
