module.exports = {
  apps: [
    {
      name: "Website",
      script: "./website/index.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "logs/err.log",
      out_file: "logs/out.log"
    },
    {
      name: "Backup",
      script: "./cronjob/cronjob.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "logs/err.log",
      out_file: "logs/out.log"
    },
    {
      name: "Discord-Bot",
      script: "./discord/discord-bot.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      restart_delay: 1000,
      error_file: "logs/err.log",
      out_file: "logs/out.log",
    },
    {
      name: "YouTube-Bot",
      script: "./youtube/youtube_bot.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      restart_delay: 1000,
      error_file: "logs/err.log",
      out_file: "logs/out.log",
    },
    {
      name: "Gamespage",
      script: "./gamesite/app.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "logs/err.log",
      out_file: "logs/out.log"
    },
    {
      name: "Gameimport-Steam",
      script: "./steam/app.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "logs/err.log",
      out_file: "logs/out.log"
    },
    {
      name: "Gameimport-Humble",
      script: "./humble/games-humble.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "logs/err.log",
      out_file: "logs/out.log"
    }
  ]
}
