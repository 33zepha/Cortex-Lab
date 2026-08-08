import { describe, it, expect, beforeEach, afterEach } from "vitest";
import handler from "../../../api/proxy";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import http from "node:http";

function mockReq(options: Partial<VercelRequest>): VercelRequest {
  return {
    method: "GET",
    url: "/api/proxy?path=health",
    headers: { accept: "application/json" },
    query: { path: "health" },
    [Symbol.asyncIterator]: async function* () {},
    ...options,
  } as unknown as VercelRequest;
}

function mockRes() {
  let statusCode = 200;
  const headers: Record<string, string> = {};
  let bodyData = "";
  let ended = false;

  const res: Partial<VercelResponse> = {
    headersSent: false,
    status(code: number) {
      statusCode = code;
      return res as VercelResponse;
    },
    setHeader(key: string, value: string) {
      headers[key.toLowerCase()] = value;
      return res as VercelResponse;
    },
    json(data: any) {
      bodyData = JSON.stringify(data);
      ended = true;
      return res as VercelResponse;
    },
    write(chunk: any) {
      if (chunk) {
        bodyData += Buffer.isBuffer(chunk)
          ? chunk.toString("utf8")
          : chunk instanceof Uint8Array
          ? Buffer.from(chunk).toString("utf8")
          : String(chunk);
      }
      return true;
    },
    end(chunk?: any) {
      if (chunk) {
        bodyData += Buffer.isBuffer(chunk)
          ? chunk.toString("utf8")
          : chunk instanceof Uint8Array
          ? Buffer.from(chunk).toString("utf8")
          : String(chunk);
      }
      ended = true;
      return res as VercelResponse;
    },
  };

  return {
    res: res as VercelResponse,
    getStatus: () => statusCode,
    getHeaders: () => headers,
    getBody: () => bodyData,
    isEnded: () => ended,
  };
}

async function createSessionCookie(): Promise<string> {
  process.env.CORTEX_ACCESS_USER = "boss";
  process.env.CORTEX_ACCESS_PASSWORD = "test-password";
  process.env.CORTEX_SESSION_SECRET = "test-session-secret";

  const req = mockReq({
    method: "POST",
    url: "/api/proxy?path=auth/login",
    query: { path: ["auth", "login"] },
    body: { username: "boss", password: "test-password" },
  });
  const response = mockRes();
  await handler(req, response.res);
  expect(response.getStatus()).toBe(200);
  const setCookie = response.getHeaders()["set-cookie"];
  expect(setCookie).toBeTruthy();
  return setCookie.split(";")[0];
}

describe("Vercel Node Proxy Handler (api/proxy.ts)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("refuse le proxy sans session Cortex", async () => {
    process.env.CORTEX_ACCESS_PASSWORD = "test-password";
    process.env.CORTEX_SESSION_SECRET = "test-session-secret";
    const req = mockReq({});
    const { res, getStatus, getBody } = mockRes();

    await handler(req, res);

    expect(getStatus()).toBe(401);
    expect(JSON.parse(getBody())).toEqual({ error: "Cortex session required" });
  });

  it("retourne 503 si CORTEX_API_ORIGIN est manquant après authentification", async () => {
    delete process.env.CORTEX_API_ORIGIN;
    const cookie = await createSessionCookie();
    const req = mockReq({ headers: { accept: "application/json", cookie } });
    const { res, getStatus, getBody } = mockRes();

    await handler(req, res);

    expect(getStatus()).toBe(503);
    expect(JSON.parse(getBody())).toEqual({ error: "CORTEX_API_ORIGIN manquant côté Vercel" });
  });

  it("retourne 502 si le VPS upstream n'est pas joignable", async () => {
    process.env.CORTEX_API_ORIGIN = "http://127.0.0.1:59999";
    const cookie = await createSessionCookie();
    const req = mockReq({
      url: "/api/proxy?path=health",
      query: { path: "health" },
      headers: { accept: "application/json", cookie },
    });
    const { res, getStatus, getBody } = mockRes();

    await handler(req, res);

    expect(getStatus()).toBe(502);
    expect(JSON.parse(getBody())).toEqual({ error: "API Cortex centrale inaccessible (502 Bad Gateway)" });
  });

  it("proxifie correctement une route 1-segment (/api/health)", async () => {
    let receivedUrl = "";
    let receivedAuth = "";

    const server = http.createServer((sReq, sRes) => {
      receivedUrl = sReq.url ?? "";
      receivedAuth = sReq.headers.authorization ?? "";
      sRes.writeHead(200, { "content-type": "application/json" });
      sRes.end(JSON.stringify({ status: "ok" }));
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as { port: number };

    process.env.CORTEX_API_ORIGIN = `http://127.0.0.1:${address.port}`;
    process.env.CORTEX_API_TOKEN = "secret_token_123";
    const cookie = await createSessionCookie();

    const req = mockReq({
      url: "/api/proxy?path=health",
      query: { path: "health" },
      headers: { accept: "application/json", cookie },
    });
    const { res, getStatus, getBody } = mockRes();

    await handler(req, res);
    server.close();

    expect(getStatus()).toBe(200);
    expect(receivedUrl).toBe("/api/health");
    expect(receivedAuth).toBe("Bearer secret_token_123");
    expect(JSON.parse(getBody())).toEqual({ status: "ok" });
  });

  it("proxifie correctement les routes multi-segments (/api/tokens/weekly)", async () => {
    let receivedUrl = "";

    const server = http.createServer((sReq, sRes) => {
      receivedUrl = sReq.url ?? "";
      sRes.writeHead(200, { "content-type": "application/json" });
      sRes.end(JSON.stringify({ days: [] }));
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as { port: number };

    process.env.CORTEX_API_ORIGIN = `http://127.0.0.1:${address.port}`;
    const cookie = await createSessionCookie();

    const req = mockReq({
      url: "/api/proxy?path=tokens/weekly&foo=bar",
      query: { path: ["tokens", "weekly"], foo: "bar" },
      headers: { accept: "application/json", cookie },
    });
    const { res, getStatus, getBody } = mockRes();

    await handler(req, res);
    server.close();

    expect(getStatus()).toBe(200);
    expect(receivedUrl).toBe("/api/tokens/weekly?foo=bar");
    expect(JSON.parse(getBody())).toEqual({ days: [] });
  });

  it("relaye un signup vers le runtime et signe une session utilisateur", async () => {
    let receivedPath = "";
    let receivedAuth = "";
    let receivedBody = "";
    let receivedCookie = "";

    const server = http.createServer((sReq, sRes) => {
      receivedPath = sReq.url ?? "";
      receivedAuth = sReq.headers.authorization ?? "";
      receivedCookie = sReq.headers.cookie ?? "";
      sReq.setEncoding("utf8");
      sReq.on("data", (chunk) => { receivedBody += chunk; });
      sReq.on("end", () => {
        if (sReq.url === "/api/workspace") {
          sRes.writeHead(200, { "content-type": "application/json" });
          sRes.end(JSON.stringify({ user: "ada@example.com", workspace: { name: "Operations" } }));
          return;
        }
        sRes.writeHead(201, { "content-type": "application/json" });
        sRes.end(JSON.stringify({ authenticated: true, user: "ada@example.com", workspace: { name: "Operations" } }));
      });
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as { port: number };
    process.env.CORTEX_API_ORIGIN = `http://127.0.0.1:${address.port}`;
    process.env.CORTEX_API_TOKEN = "service-token";
    process.env.CORTEX_SESSION_SECRET = "session-secret";

    const req = mockReq({
      method: "POST",
      url: "/api/proxy?path=auth/signup",
      query: { path: ["auth", "signup"] },
      body: { email: "ada@example.com", password: "correct horse battery staple", workspaceName: "Operations" },
    });
    const response = mockRes();

    await handler(req, response.res);

    const signupPath = receivedPath;
    const signupAuth = receivedAuth;
    const signupBody = receivedBody;
    const setCookie = response.getHeaders()["set-cookie"].split(";")[0];
    const workspaceRequest = mockReq({
      method: "GET",
      url: "/api/proxy?path=workspace",
      query: { path: "workspace" },
      headers: { accept: "application/json", cookie: setCookie },
    });
    const workspaceResponse = mockRes();
    await handler(workspaceRequest, workspaceResponse.res);
    server.close();

    expect(response.getStatus()).toBe(201);
    expect(response.getHeaders()["set-cookie"]).toContain("cortex_session=");
    expect(signupPath).toBe("/api/auth/signup");
    expect(signupAuth).toBe("Bearer service-token");
    expect(JSON.parse(signupBody)).toMatchObject({ email: "ada@example.com", workspaceName: "Operations" });
    expect(JSON.parse(response.getBody()).user).toBe("ada@example.com");
    expect(workspaceResponse.getStatus()).toBe(200);
    expect(receivedCookie).toContain("cortex_session=");
  });

  it("ne transmet pas une identité utilisateur forgée par le navigateur", async () => {
    let receivedUserHeader = "";
    let receivedCookie = "";
    const server = http.createServer((sReq, sRes) => {
      receivedUserHeader = String(sReq.headers["x-cortex-user"] ?? "");
      receivedCookie = sReq.headers.cookie ?? "";
      sRes.writeHead(200, { "content-type": "application/json" });
      sRes.end(JSON.stringify({ status: "ok" }));
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as { port: number };
    process.env.CORTEX_API_ORIGIN = `http://127.0.0.1:${address.port}`;
    process.env.CORTEX_API_TOKEN = "service-token";
    const cookie = await createSessionCookie();

    const req = mockReq({
      url: "/api/proxy?path=health",
      query: { path: "health" },
      headers: { accept: "application/json", cookie, "x-cortex-user": "attacker@example.com" },
    });
    const response = mockRes();
    await handler(req, response.res);
    server.close();

    expect(response.getStatus()).toBe(200);
    expect(receivedUserHeader).toBe("");
    expect(receivedCookie).toContain("cortex_session=");
  });

  it("refuse un secret de session de secours en production", async () => {
    process.env.CORTEX_ENV = "production";
    delete process.env.CORTEX_SESSION_SECRET;
    process.env.CORTEX_ACCESS_PASSWORD = "test-password";

    const req = mockReq({
      method: "POST",
      url: "/api/proxy?path=auth/login",
      query: { path: ["auth", "login"] },
      body: { username: "boss", password: "test-password" },
    });
    const response = mockRes();
    await handler(req, response.res);

    expect(response.getStatus()).toBe(503);
    expect(JSON.parse(response.getBody()).error).toMatch(/SESSION_SECRET/);
  });
});
