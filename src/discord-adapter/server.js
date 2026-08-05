import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { pathToFileURL } from 'node:url';
import { createDiscordAdapterRuntime } from './runtime.js';

export function createPostgresPrismaClient({ databaseUrl }) {
  if (typeof databaseUrl !== 'string' || databaseUrl.length === 0) {
    throw new TypeError('databaseUrl must be a non-empty string');
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}

function start() {
  const runtime = createDiscordAdapterRuntime({
    environment: process.env,
    createPrismaClient: () => createPostgresPrismaClient({ databaseUrl: process.env.DATABASE_URL }),
  });
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  const server = runtime.app.listen(port, '0.0.0.0', () => {
    console.info(`Discord adapter listening on port ${port}`);
  });

  const shutdown = (signal) => {
    console.info(`Discord adapter received ${signal}; shutting down`);
    server.close(() => {
      runtime.prisma.$disconnect().finally(() => process.exit(0));
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  start();
}
