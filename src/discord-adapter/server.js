import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { pathToFileURL } from 'node:url';
import { createDiscordAdapterRuntime } from './runtime.js';
import { createDiscordBotRuntime } from './bot-runtime.js';
import { createDiscordJsClientFactory } from './discordjs-client-factory.js';
import { createApplicationLogger } from '../shared/application-logger.js';

export function createPostgresPrismaClient({ databaseUrl }) {
  if (typeof databaseUrl !== 'string' || databaseUrl.length === 0) {
    throw new TypeError('databaseUrl must be a non-empty string');
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}

async function start() {
  const logger = createApplicationLogger({ service: 'simpleyth-discord-adapter' });
  const prisma = createPostgresPrismaClient({ databaseUrl: process.env.DATABASE_URL });
  const botRuntime = createDiscordBotRuntime({
    prisma,
    clientFactory: createDiscordJsClientFactory(),
    logger,
  });
  const startedBots = await botRuntime.start();

  const runtime = createDiscordAdapterRuntime({
    environment: process.env,
    createPrismaClient: () => prisma,
    botManager: botRuntime.manager,
  });
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  const server = runtime.app.listen(port, '0.0.0.0', () => {
    logger.info('adapter_listening', { port, startedBotCount: startedBots.length });
  });

  const pollIntervalMs = Number.parseInt(process.env.DISCORD_BOT_POLL_INTERVAL_MS ?? String(60 * 1000), 10);
  const pollTimer = setInterval(async () => {
    try {
      const syncResult = await botRuntime.manager.pollAndSyncBots();
      if (syncResult.started.length > 0 || syncResult.stopped.length > 0 || syncResult.updated.length > 0) {
        logger.info('bot_poll_synchronized', {
          started: syncResult.started,
          stopped: syncResult.stopped,
          updated: syncResult.updated,
        });
      }
    } catch (error) {
      logger.error('bot_poll_sync_failed', { error: error?.message });
    }
  }, pollIntervalMs);
  if (typeof pollTimer.unref === 'function') pollTimer.unref();

  const shutdown = (signal) => {
    logger.info('adapter_shutdown_requested', { signal });
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
  start().catch((error) => {
    createApplicationLogger({ service: 'simpleyth-discord-adapter' }).error('adapter_startup_failed', { error: error?.message });
    process.exitCode = 1;
  });
}
