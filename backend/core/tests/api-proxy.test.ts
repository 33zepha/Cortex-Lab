import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import handler from "../../../api/[...path]";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import http from "node:http";

function mockReq(options: Partial<VercelRequest>): VercelRequest {
  return {
    method: "GET",
    url: "/api/health?path=health",
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

describe("Vercel Node Proxy Handler (api/[...path].ts)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("retourne 503 si CORTEX_API_ORIGIN est manquant", async () => {
    delete process.env.CORTEX_API_ORIGIN;
    const req = mockReq({});
    const { res, getStatus, getBody } = mockRes();

    await handler(req, res);

    expect(getStatus()).toBe(503);
    expect(JSON.parse(getBody())).toEqual({ error: "CORTEX_API_ORIGIN manquant côté Vercel" });
  });

  it("retourne 502 si le VPS upstream n'est pas joignable", async () => {
    process.env.CORTEX_API_ORIGIN = "http://127.0.0.1:59999";
    const req = mockReq({ url: "/api/health?path=health" });
    const { res, getStatus, getBody } = mockRes();

    await handler(req, res);

    expect(getStatus()).toBe(502);
    expect(JSON.parse(getBody())).toEqual({ error: "API Cortex centrale inaccessible (502 Bad Gateway)" });
  });

  it("proxifie correctement une requête HTTP avec headers et stripped path query", async () => {
    // Crée un mock serveur HTTP local
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

    const req = mockReq({ url: "/api/missions?status=active&path=missions" });
    const { res, getStatus, getBody } = mockRes();

    await handler(req, res);

    server.close();

    expect(getStatus()).toBe(200);
    expect(receivedUrl).toBe("/api/missions?status=active");
    expect(receivedAuth).toBe("Bearer secret_token_123");
    expect(JSON.parse(getBody())).toEqual({ status: "ok" });
  });
});
