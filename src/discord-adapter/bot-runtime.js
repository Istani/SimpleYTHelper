import { createMultiBotManager } from './multi-bot-manager.js';
import { createPrismaBotRegistrationRepository } from './prisma-bot-registration-repository.js';
import { createDiscordDataRepository } from './discord-data-repository.js';
import { attachDiscordEventHandlers } from './discord-event-handler.js';

/** Shared runtime core for one isolated Discord account kind. */
export function createDiscordAccountRuntime({ prisma, clientFactory, logger, accountKind = 'bot' }) {
  const registrationRepository = createPrismaBotRegistrationRepository({ prisma, accountKind });
  const dataRepository = createDiscordDataRepository({ prisma });
  const manager = createMultiBotManager({
    clientFactory,
    registrationRepository,
    onClientStarted: ({ client, registration }) => attachDiscordEventHandlers({
      client,
      dataRepository,
      sourceId: registration.bot_id,
      settings: registration.settings,
      hydrateGuildCache: accountKind === 'selfbot',
      logger,
    }),
  });

  return {
    start: () => manager.loadActiveBotsFromDatabase(),
    shutdown: () => manager.shutdownAll(),
    manager,
  };
}

/** Backward-compatible official Discord bot runtime. */
export function createDiscordBotRuntime(options) {
  return createDiscordAccountRuntime({ ...options, accountKind: 'bot' });
}
