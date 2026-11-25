const NAME = /^[a-z0-9_]{1,32}$/;

function parseCommand(content, prefix) {
  const text = String(content || "");
  if (!text.startsWith(prefix)) return null;
  const parts = text
    .slice(prefix.length)
    .trim()
    .split(/\s+/);
  const name = String(parts.shift() || "").toLowerCase();
  if (!NAME.test(name)) return null;
  return { name, query: parts.join(" ").slice(0, 200) };
}

function ownerKey(ownerId) {
  return ownerId == null ? "global" : "user:" + String(ownerId);
}

function isSafeTemplate(value) {
  return (
    typeof value === "string" &&
    value.length <= 400 &&
    !/[\u0000-\u001f]/.test(value)
  );
}

function renderTemplate(template, context) {
  return String(template || "")
    .replace(/\$\(channel\)/g, String(context.channel || ""))
    .slice(0, 400);
}

function commandFor(commands, parsed) {
  return commands.find(command => command.name === parsed.name) || null;
}

module.exports = {
  parseCommand,
  ownerKey,
  isSafeTemplate,
  renderTemplate,
  commandFor
};
