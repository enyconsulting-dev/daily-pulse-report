import { createHmac, timingSafeEqual } from "node:crypto";
import type { VercelRequest } from "@vercel/node";

const COOKIE_NAME = "daily_pulse_admin";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function getCookie(req: VercelRequest): string | undefined {
  return req.headers.cookie
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function isValidAdminSession(req: VercelRequest): boolean {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = getCookie(req);
  if (!secret || !token) return false;

  const separator = token.lastIndexOf(".");
  if (separator < 1) return false;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!safeEqual(signature, sign(payload, secret))) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64").toString("utf8")) as { expiresAt?: number };
    return typeof session.expiresAt === "number" && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function createAdminSessionCookie(secret: string, secure: boolean): string {
  const payload = Buffer.from(
    JSON.stringify({ expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 }),
  ).toString("base64");
  const token = `${payload}.${sign(payload, secret)}`;
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SECONDS}${secure ? "; Secure" : ""}`;
}

export function clearAdminSessionCookie(secure: boolean): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure ? "; Secure" : ""}`;
}

export function requestIsSameOrigin(req: VercelRequest): boolean {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function isSecureRequest(req: VercelRequest): boolean {
  return req.headers["x-forwarded-proto"] === "https";
}

export function adminPasswordMatches(password: unknown): boolean {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  return typeof password === "string" && !!configuredPassword && safeEqual(password, configuredPassword);
}
