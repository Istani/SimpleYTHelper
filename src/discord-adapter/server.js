import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { pathToFileURL } from 'node:url';
import { createDiscordAdapterRuntime } from './runtime.js';
import { createDiscordBotRuntime } from './bot-runtime.js';
import { createDiscordJsClientFactory } from './discordjs-client-factory.js';

export function createPostgresPrismaClient({ databaseUrl }) {
  if (typeof databaseUrl !== 'string' || databaseUrl.length === 0) {
    throw new TypeError('databaseUrl must be a non-empty string');
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}

async function start() {
  const prisma = createPostgresPrismaClient({ databaseUrl: process.env.DATABASE_URL });
  const botRuntime = createDiscordBotRuntime({
    prisma,
    clientFactory: createDiscordJsClientFactory(),
  });
  const startedBots = await botRuntime.start();

  const runtime = createDiscordAdapterRuntime({
    environment: process.env,
    createPrismaClient: () => prisma,
    botManager: botRuntime.manager,
  });
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  const server = runtime.app.listen(port, '0.0.0.0', () => {
    console.info(`Discord adapter listening on port ${port}; started ${startedBots.length} bot(s)`);
  });

  const pollIntervalMs = Number.parseInt(process.env.DISCORD_BOT_POLL_INTERVAL_MS ?? String(60 * 1000), 10);
  const pollTimer = setInterval(async () => {
    try {
      const syncResult = await botRuntime.manager.pollAndSyncBots();
      if (syncResult.started.length > 0 || syncResult.stopped.length > 0 || syncResult.updated.length > 0) {
        console.info(`Bot poll sync: started=${syncResult.started.join(',') || 'none'}, stopped=${syncResult.stopped.join(',') || 'none'}, updated=${syncResult.updated.join(',') || 'none'}`);
      }
    } catch (error) {
      console.error('Failed to poll and synchronize bot registrations', error);
    }
  }, pollIntervalMs);
  if (typeof pollTimer.unref === 'function') pollTimer.unref();

  const shutdown = (signal) => {
    console.info(`Discord adapter received ${signal}; shutting down`);
    clearInterval(pollTimer);
    server.close(() => {
      botRuntime.shutdown()
        .finally(() => runtime.prisma.$disconnect())
        .finally(() => process.exit(0));
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  start().catch(() => {
    console.error('Discord adapter startup failed');
    process.exitCode = 1;
  });
}
