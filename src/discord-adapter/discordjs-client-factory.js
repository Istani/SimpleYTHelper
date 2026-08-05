import { Client, GatewayIntentBits } from 'discord.js';

export function createDiscordJsClientFactory({
  Client: DiscordClient = Client,
  GatewayIntentBits: intents = GatewayIntentBits,
} = {}) {
  return ({ settings = {} }) => {
    const requestedIntents = [intents.Guilds];
    if (settings.listenMessages || settings.allowCommands) {
      requestedIntents.push(intents.GuildMessages, intents.MessageContent);
    }

    return new DiscordClient({ intents: requestedIntents });
  };
}
