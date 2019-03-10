module.exports = {
  apps: [
    {
      name: 'SYTH-Core',
      script: './app.js',
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      autorestart: false
    }
    /*{
      name: "SYTH-Web",
      script: "./website/index.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "logs/err.log",
      out_file: "logs/out.log"
    },*/
    {
      name: "SYTH-Backup",
      script: "./cronjob/app.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "logs/err.log",
      out_file: "logs/out.log"
    },
    /*{
      name: "SYTH-Discord",
      script: "./discord/app.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      restart_delay: 1000,
      error_file: "logs/err.log",
      out_file: "logs/out.log",
    },*/
    /*{
      name: "SYTH-YouTube",
      script: "./youtube/youtube_bot.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      restart_delay: 1000,
      error_file: "logs/err.log",
      out_file: "logs/out.log",
    },*/
    {
      name: "GAME-Web",
      script: "./gamesite/app.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "logs/err.log",
      out_file: "logs/out.log"
    },
    /*{
      name: 'SYTH-Amazon',
      script: "./amazon/app.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "logs/err.log",
      out_file: "logs/out.log"
    },*/
    {
      name: "SYTH-Steam",
      script: "./steam/app.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "logs/err.log",
      out_file: "logs/out.log"
    },
    {
      name: "SYTH-Humble",
      script: "./humble/games-humble.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "logs/err.log",
      out_file: "logs/out.log"
    }
  ]
}
