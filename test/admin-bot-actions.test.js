import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("uses the JWT subject as server-side bot-audit actor", async () => {
  const source = await readFile(new URL("../app/admin/actions.js", import.meta.url), "utf8");
  assert.match(source, /actorId:\s*session\.sub/);
  assert.doesNotMatch(source, /session\.user\.id/);
});
