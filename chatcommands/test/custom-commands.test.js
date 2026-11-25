const assert = require("assert");
const commands = require("../lib/custom-commands.js");
assert.deepStrictEqual(commands.parseCommand("!foo hello world", "!"), {
  name: "foo",
  query: "hello world"
});
assert.strictEqual(commands.parseCommand("!foobar", "!").name, "foobar");
assert.strictEqual(commands.parseCommand("!foo-bar", "!"), null);
assert.strictEqual(commands.parseCommand("hello", "!"), null);
assert.strictEqual(commands.ownerKey(null), "global");
assert.strictEqual(commands.ownerKey(42), "user:42");
assert.strictEqual(
  commands.renderTemplate("Hi $(channel)!", { channel: "Nora" }),
  "Hi Nora!"
);
assert.strictEqual(commands.isSafeTemplate("text"), true);
assert.strictEqual(commands.isSafeTemplate("text\n"), false);
console.log("custom-commands: ok");
