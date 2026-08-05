import assert from "node:assert/strict";
import test from "node:test";
import {
  createBotRegistration,
  updateBotRegistration,
} from "../src/web/admin/bot-management.js";

function fakePrisma() {
  const calls = [];
  return {
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
    },
  };
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
    settings: { allowReports: true, listenMessages: false },
    isActive: true,
  });
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
