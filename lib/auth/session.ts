import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "crtx_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

type SessionPayload = {
  userId: string;
};

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || "";
  if (!secret) {
    throw new Error("SESSION_SECRET env var is required for session signing");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getSecret();
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret);
  return jwt;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.userId !== "string") {
      return null;
    }
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;
  return verifySessionToken(cookie);
}

export function setSessionCookie(
  res: NextResponse,
  token: string,
): void {
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

// Convenience for server components (not route handlers) to read session
export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

