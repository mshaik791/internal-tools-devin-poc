import { jwtVerify, SignJWT } from "jose";
import type { Session } from "./types";

export const SESSION_COOKIE = "it_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set (>= 32 chars)");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(session: Session): Promise<string> {
  const { sub, ...claims } = session;
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

/** Returns the session, or null for a missing, tampered or expired token. */
export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const { sub, name, email, role, regions } = payload;
    if (
      typeof sub !== "string" ||
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof role !== "string" ||
      !Array.isArray(regions) ||
      !regions.every((r) => typeof r === "string")
    ) {
      return null;
    }
    return { sub, name, email, role, regions };
  } catch {
    return null;
  }
}
