module.exports = {
  apps: [
    {
      name: "Website",
      script: "./index.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "err.log",
      out_file: "out.log",
      merge_logs: true
    },
    {
      name: "Discord-Bot",
      script: "./discord-bot.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      restart_delay: 1000,
      error_file: "err.log",
      out_file: "out.log",
      merge_logs: true
    },
    {
      name: "YouTube-Bot",
      script: "./youtube_bot.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      restart_delay: 1000,
      error_file: "err.log",
      out_file: "out.log",
      merge_logs: true
    }
  ]
}
