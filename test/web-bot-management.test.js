import assert from "node:assert/strict";
import test from "node:test";
import {
  createBotRegistration,
  updateBotRegistration,
  publicBotRegistration,
} from "../src/web/admin/bot-management.js";

function fakePrisma() {
  const calls = [];
  const prisma = {
    calls,
    discordBotRegistration: {
      create: async (argument) => {
        calls.push({ method: "create", argument });
        return argument.data;
      },
      update: async (argument) => {
        calls.push({ method: "update", argument });
        return { botId: argument.where.botId, ...argument.data };
      },
      findUnique: async () => ({ botId: 'community-reporter', isActive: true, settings: { allowCommands: false, allowReports: true, listenMessages: false } }),
    },
    discordBotAdminAudit: {
      create: async (argument) => { calls.push({ method: 'audit', argument }); return argument.data; },
    },
  };
  prisma.$transaction = async (operation) => typeof operation === "function" ? operation(prisma) : Promise.all(operation);
  return prisma;
}

test("creates an active bot registration with validated settings", async () => {
  const prisma = fakePrisma();
  const result = await createBotRegistration({
    prisma,
    botId: "community-reporter",
    token: "discord-test-token-that-is-long-enough",
    settingsInput: '{"allowReports":true,"listenMessages":false}',
  });

  assert.equal(result.botId, "community-reporter");
  assert.equal(prisma.calls[0].method, "create");
  assert.deepEqual(prisma.calls[0].argument.data, {
    botId: "community-reporter",
    token: "discord-test-token-that-is-long-enough",
    accountKind: 'bot',
    settings: { allowReports: true, listenMessages: false },
    isActive: true,
  });
});


test("creates a selfbot registration as an isolated account type", async () => {
  const prisma = fakePrisma();
  await createBotRegistration({ prisma, botId: "inbound-selfbot", accountKind: 'selfbot', token: "discord-test-token-that-is-long-enough", settingsInput: '{"listenMessages":true}' });
  assert.equal(prisma.calls[0].argument.data.accountKind, 'selfbot');
  assert.equal(prisma.calls[0].argument.data.settings.listenMessages, true);
});

test("audits bot creation without including its token", async () => {
  const prisma = fakePrisma();
  await createBotRegistration({ prisma, actorId: 'admin-1', botId: 'new-bot', token: 'discord-test-token-that-is-long-enough', settingsInput: '{"allowReports":true}' });
  const audit = prisma.calls.find((call) => call.method === 'audit').argument.data;
  assert.deepEqual(audit, { botId: 'new-bot', actorId: 'admin-1', action: 'created', details: { accountKind: 'bot', isActive: true, capabilities: { allowReports: true }, tokenRotated: true } });
  assert.equal(JSON.stringify(audit).includes('discord-test-token-that-is-long-enough'), false);
});

test("rejects malformed identifiers, short tokens, and non-object settings", async () => {
  const prisma = fakePrisma();
  await assert.rejects(() => createBotRegistration({ prisma, botId: "no spaces", token: "discord-test-token-that-is-long-enough", settingsInput: "{}" }), /bot_id/);
  await assert.rejects(() => createBotRegistration({ prisma, botId: "valid-bot", token: "short", settingsInput: "{}" }), /Token/);
  await assert.rejects(() => createBotRegistration({ prisma, botId: "valid-bot", token: "discord-test-token-that-is-long-enough", settingsInput: "[]" }), /JSON object/);
});

test("updates activation and settings without replacing a blank token", async () => {
  const prisma = fakePrisma();
  await updateBotRegistration({
    prisma,
    botId: "community-reporter",
    isActive: false,
    token: "",
    settingsInput: '{"allowCommands":true}',
  });

  assert.deepEqual(prisma.calls[0].argument, {
    where: { botId: "community-reporter" },
    data: { isActive: false, settings: { allowCommands: true } },
  });
});

test("rotates a token only when a valid replacement is supplied", async () => {
  const prisma = fakePrisma();
  await updateBotRegistration({
    prisma,
    botId: "community-reporter",
    isActive: true,
    token: "new-discord-token-that-is-long-enough",
    settingsInput: "{}",
  });

  assert.equal(prisma.calls[0].argument.data.token, "new-discord-token-that-is-long-enough");
  assert.ok(prisma.calls[0].argument.data.rotatedAt instanceof Date);
});

test("audits configuration diffs and token rotation without retaining the token", async () => {
  const prisma = fakePrisma();
  await updateBotRegistration({
    prisma, actorId: 'admin-1', botId: 'community-reporter', isActive: false,
    token: 'replacement-discord-token-that-is-long-enough', settingsInput: '{"allowCommands":true,"allowReports":true}',
  });

  const audit = prisma.calls.find((call) => call.method === 'audit').argument.data;
  assert.equal(audit.actorId, 'admin-1');
  assert.equal(audit.action, 'updated');
  assert.deepEqual(audit.details, {
    isActive: { from: true, to: false },
    capabilities: { allowCommands: { from: false, to: true }, listenMessages: { from: false, to: undefined } },
    tokenRotated: true,
  });
  assert.equal(JSON.stringify(audit).includes('replacement-discord-token-that-is-long-enough'), false);
});

test("exposes only token-safe audit facts to the bot UI", () => {
  const visible = publicBotRegistration({
    botId: 'community-reporter', settings: {}, isActive: true, createdAt: new Date(), updatedAt: new Date(), token: 'must-not-leak',
    audits: [{ actorId: 'admin-1', action: 'updated', details: { tokenRotated: true }, createdAt: new Date() }],
  });
  assert.deepEqual(visible.audits, [{ actorId: 'admin-1', action: 'updated', details: { tokenRotated: true }, createdAt: visible.audits[0].createdAt }]);
  assert.equal(JSON.stringify(visible).includes('must-not-leak'), false);
});
