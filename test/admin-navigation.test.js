import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("renders Discord moderation, bot administration, and connected services as sidebar links for admins", async () => {
  const source = await readFile(new URL("../src/web/components/dashboard-shell.js", import.meta.url), "utf8");
  assert.match(source, /href="\/admin\/discord\/moderation"[^>]*>Discord-Moderation/);
  assert.match(source, /href="\/admin\/discord\/bots"[^>]*>Discord-Bots/);
  assert.match(source, /href="\/admin\/discord\/oauth"[^>]*>Discord Developer Settings/);
  assert.match(source, /href="\/connections"[^>]*>Verknüpfte Dienste/);
});
