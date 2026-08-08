import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "cortex_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
export const SESSION_SECRET_MIN_LENGTH = 32;
export const DEVELOPMENT_SESSION_SECRET = "local-development-session-secret";

export function resolveSessionSecret(raw: string | undefined, production: boolean): string {
  const configured = raw?.trim() ?? "";
  if (configured) return configured;
  return production ? "" : DEVELOPMENT_SESSION_SECRET;
}

export function isAcceptableSessionSecret(secret: string, production: boolean): boolean {
  if (!secret) return false;
  return !production || secret.length >= SESSION_SECRET_MIN_LENGTH;
}

type SessionPayload = {
  sub: string;
  exp: number;
};

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(encoded: string): SessionPayload | null {
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (typeof payload.sub !== "string" || !payload.sub || typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) return null;
    return { sub: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}

function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(subject: string, expiresAt: number, secret: string): string {
  const payload = encodePayload({ sub: subject, exp: expiresAt });
  return `${payload}.${signature(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined, secret: string, now = Date.now()): string | null {
  if (!token || !secret) return null;
  const [encodedPayload, receivedSignature, ...extra] = token.split(".");
  if (!encodedPayload || !receivedSignature || extra.length > 0) return null;

  const payload = decodePayload(encodedPayload);
  if (!payload || payload.exp <= now) return null;

  const expectedSignature = signature(encodedPayload, secret);
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(receivedSignature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  return payload.sub;
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};

  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => {
        const [name, ...value] = part.trim().split("=");
        if (!name) return ["", ""];
        try {
          return [name, decodeURIComponent(value.join("="))];
        } catch {
          return [name, value.join("=")];
        }
      })
      .filter(([name]) => Boolean(name)),
  );
}

export function getSessionSubject(cookieHeader: string | undefined, secret: string): string | null {
  return verifySessionToken(parseCookies(cookieHeader)[SESSION_COOKIE], secret);
}

export function buildSessionCookie(token: string, maxAge: number, secure: boolean): string {
  const secureAttribute = secure ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly${secureAttribute}; SameSite=Lax; Max-Age=${maxAge}`;
}
