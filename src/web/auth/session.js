import { cookies } from "next/headers.js";
import { redirect } from "next/navigation.js";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

export const sessionCookie = {
  name: "syth_session",
  options: { httpOnly: true, sameSite: "lax", secure: process.env.WEB_COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8 },
};

function secret() {
  const value = process.env.WEB_AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("WEB_AUTH_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(value);
}

export async function createSessionToken(user) {
  return new SignJWT({ name: user.name, email: user.email, roles: user.roles }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime("8h").sign(secret());
}

export async function verifySessionToken(token) {
  try { const { payload } = await jwtVerify(token, secret()); return payload; } catch { return null; }
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(sessionCookie.name)?.value;
  return token ? verifySessionToken(token) : null;
}

export async function requireRole(role) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.roles?.includes(role)) redirect("/dashboard");
  return session;
}

export const discordOAuthStateCookie = {
  name: 'syth_discord_oauth_state',
  options: { httpOnly: true, sameSite: 'lax', secure: sessionCookie.options.secure, path: '/api/connections/discord/callback', maxAge: 10 * 60 },
};

export async function createDiscordOAuthState(webUserId) {
  if (!webUserId) throw new Error('Sitzungsbenutzer fehlt');
  return new SignJWT({ purpose: 'discord-oauth', nonce: randomUUID() })
    .setProtectedHeader({ alg: 'HS256' }).setSubject(webUserId).setIssuedAt().setExpirationTime('10m').sign(secret());
}

export async function verifyDiscordOAuthState(state) {
  try {
    const { payload } = await jwtVerify(state, secret());
    if (payload.purpose !== 'discord-oauth' || !payload.sub || !payload.nonce) return null;
    return payload;
  } catch { return null; }
}
