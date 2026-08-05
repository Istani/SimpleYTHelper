import { timingSafeEqual } from "node:crypto";

export const roles = ["admin", "creator", "viewer"];

function configuredUsers() {
  let parsed;
  try { parsed = JSON.parse(process.env.WEB_USERS_JSON || "[]"); } catch { throw new Error("WEB_USERS_JSON must be valid JSON"); }
  if (!Array.isArray(parsed)) throw new Error("WEB_USERS_JSON must contain an array");
  return parsed.filter((user) => user && user.email && user.password).map((user) => ({
    id: String(user.id || user.email), email: String(user.email).toLowerCase(), name: String(user.name || user.email),
    roles: [...new Set(Array.isArray(user.roles) ? user.roles.filter((role) => roles.includes(role)) : roles.includes(user.role) ? [user.role] : [])],
    password: String(user.password),
  })).filter((user) => user.roles.length > 0);
}

function safeTextEqual(left, right) {
  const a = Buffer.from(String(left)); const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function authenticate(email, password) {
  const candidate = configuredUsers().find((user) => user.email === String(email || "").toLowerCase());
  if (!candidate || !safeTextEqual(candidate.password, password || "")) return null;
  const { password: ignored, ...user } = candidate;
  return user;
}
