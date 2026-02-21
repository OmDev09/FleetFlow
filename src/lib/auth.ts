import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import * as bcrypt from "bcryptjs";
import type { Role } from "./domain";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fleetflow-dev-secret-change-in-production"
);

export type SessionPayload = {
  userId: string;
  email: string;
  role: Role;
  exp: number;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: Omit<SessionPayload, "exp">): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(SECRET);
  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("fleetflow_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("fleetflow_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("fleetflow_session");
}

export async function login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: false, error: "Invalid email or password" };
  const valid = await verifyPassword(password, user.password);
  if (!valid) return { ok: false, error: "Invalid email or password" };
  const token = await createSession({
    userId: user.id,
    email: user.email,
    role: user.role as Role,
  });
  await setSessionCookie(token);
  return { ok: true };
}

export function hasRole(session: SessionPayload | null, allowed: Role[]): boolean {
  return session !== null && allowed.includes(session.role);
}
