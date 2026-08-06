import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

let prismaInstance = null;

export function getAdminPrisma() {
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
