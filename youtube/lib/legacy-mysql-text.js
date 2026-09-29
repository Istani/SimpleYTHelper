const emoji = require("node-emoji");

function sanitizeLegacyMysqlText(value) {
  return emoji
    .unemojify(String(value ?? ""))
    .replace(/\p{Extended_Pictographic}|\p{Emoji_Modifier}/gu, "")
    .replace(/[\u200D\uFE0F]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

module.exports = sanitizeLegacyMysqlText;
