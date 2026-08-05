import { createMultiBotManager } from './multi-bot-manager.js';
import { createPrismaBotRegistrationRepository } from './prisma-bot-registration-repository.js';
import { createDiscordDataRepository } from './discord-data-repository.js';
import { attachDiscordEventHandlers } from './discord-event-handler.js';

export function createDiscordBotRuntime({ prisma, clientFactory, logger }) {
  const registrationRepository = createPrismaBotRegistrationRepository({ prisma });
  const dataRepository = createDiscordDataRepository({ prisma });
  const manager = createMultiBotManager({
    clientFactory,
    registrationRepository,
    onClientStarted: ({ client, registration }) => attachDiscordEventHandlers({
      client,
      dataRepository,
      settings: registration.settings,
      logger,
    }),
  });

  return {
    start: () => manager.loadActiveBotsFromDatabase(),
    shutdown: () => manager.shutdownAll(),
    manager,
  };
}
