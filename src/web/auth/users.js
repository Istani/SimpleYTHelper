import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const roles = ["admin", "creator", "viewer"];
const PASSWORD_HASH_PREFIX = 'scrypt';
const PASSWORD_KEY_LENGTH = 64;

let prismaInstance = null;
function getPrisma() {
  if (prismaInstance) return prismaInstance;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  try {
    prismaInstance = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    return prismaInstance;
  } catch {
    return null;
  }
}

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

export function hashPassword(password) {
  const salt = randomBytes(16).toString('base64url');
  const hash = scryptSync(String(password), salt, PASSWORD_KEY_LENGTH).toString('base64url');
  return `${PASSWORD_HASH_PREFIX}$${salt}$${hash}`;
}

export function verifyPasswordHash(password, storedValue) {
  const [prefix, salt, expectedHash] = String(storedValue).split('$');
  if (prefix !== PASSWORD_HASH_PREFIX || !salt || !expectedHash) return false;
  const actualHash = scryptSync(String(password), salt, PASSWORD_KEY_LENGTH).toString('base64url');
  return safeTextEqual(actualHash, expectedHash);
}

export async function authenticate(email, password) {
  const cleanEmail = String(email || "").toLowerCase();
  const prisma = getPrisma();

  if (prisma) {
    try {
      const dbUser = await prisma.webUser.findUnique({ where: { email: cleanEmail } });
      if (dbUser && verifyPasswordHash(password || '', dbUser.password)) {
        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          roles: dbUser.roles.filter((r) => roles.includes(r)),
        };
      }
    } catch {
      // Fallback to WEB_USERS_JSON if DB query fails
    }
  }

  const candidate = configuredUsers().find((user) => user.email === cleanEmail);
  if (!candidate || !safeTextEqual(candidate.password, password || "")) return null;
  const { password: ignored, ...user } = candidate;
  return user;
}
