import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const guildPage = new URL('../app/admin/discord/moderation/guilds/[guildId]/page.js', import.meta.url);
const channelPage = new URL('../app/admin/discord/moderation/channels/[channelId]/page.js', import.meta.url);
const memberPage = new URL('../app/admin/discord/moderation/guilds/[guildId]/members/[userId]/page.js', import.meta.url);

test('marks deleted guilds, channels, roles and members as historical in moderation details', async () => {
  const source = await readFile(guildPage, 'utf8');
  assert.match(source, /guild\.deletedAt/);
  assert.match(source, /member\.deletedAt/);
  assert.match(source, /channel\.deletedAt/);
  assert.match(source, /role\.deletedAt/);
  assert.match(source, /history-badge/);
});

test('keeps a deleted channel visible but explicitly marks its history', async () => {
  const source = await readFile(channelPage, 'utf8');
  assert.match(source, /channel\.deletedAt/);
  assert.match(source, /history-badge/);
});

test('offers a dedicated member history detail view from the guild moderation page', async () => {
  const [guildSource, memberSource] = await Promise.all([readFile(guildPage, 'utf8'), readFile(memberPage, 'utf8')]);
  assert.match(guildSource, /members\/\$\{encodeURIComponent\(member\.userId\)\}/);
  assert.match(memberSource, /guildId_userId/);
  assert.match(memberSource, /member\.deletedAt/);
  assert.match(memberSource, /history-badge/);
});

test('renders persisted Discord guild and user avatars with accessible text fallbacks', async () => {
  const [guildSource, memberSource] = await Promise.all([readFile(guildPage, 'utf8'), readFile(memberPage, 'utf8')]);
  assert.match(guildSource, /cdn\.discordapp\.com\/icons/);
  assert.match(guildSource, /guild\.icon/);
  assert.match(memberSource, /cdn\.discordapp\.com\/avatars/);
  assert.match(memberSource, /member\.user\.avatar/);
  assert.match(memberSource, /avatar-fallback/);
});
