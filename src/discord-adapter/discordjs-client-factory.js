import { Client, GatewayIntentBits, Partials } from 'discord.js';

export function createDiscordJsClientFactory({
  Client: DiscordClient = Client,
  GatewayIntentBits: intents = GatewayIntentBits,
  Partials: partials = Partials,
} = {}) {
  return ({ settings = {} }) => {
    const requestedIntents = [intents.Guilds, intents.GuildMembers];
    const options = { intents: requestedIntents };
    if (settings.listenMessages || settings.allowCommands) {
      requestedIntents.push(intents.GuildMessages, intents.MessageContent);
    }
    if (settings.listenMessages) {
      requestedIntents.push(intents.DirectMessages);
      options.partials = [partials.Channel];
    }

    return new DiscordClient(options);
  };
}
