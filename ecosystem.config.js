module.exports = {
  apps: [
    {
      name: "Website",
      script: "./index.js"
    },
    {
      name: "Discord-Bot",
      script: "./discord-bot.js",
      restart_delay: 1000
    }
  ]
}
