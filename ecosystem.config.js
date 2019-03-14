module.exports = {
  apps: [
    {
      name: 'SYTH-Core',
      script: './app.js',
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: 'logs/SYTH-Core.err',
      out_file: 'logs/SYTH-Core.log',
      autorestart: false
    },
    /*{
      name: "SYTH-Web",
      script: "./website/index.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/SYTH-Web.err",
      out_file: "logs/SYTH-Web.log"
    },*/
    /*{
      name: "SYTH-Backup",
      script: "./cronjob/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/SYTH-Backup.err",
      out_file: "logs/SYTH-Backup.log"
    },*/
    /*{
      name: "SYTH-Discord",
      script: "./discord/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 1000,
      error_file: "logs/SYTH-Discord.err",
      out_file: "logs/SYTH-Discord.log",
    },*/
    /*{
      name: "SYTH-YouTube",
      script: "./youtube/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 1000,
      error_file: "logs/SYTH-YouTube.err",
      out_file: "logs/SYTH-YouTube.log",
    },*/
    {
      name: "GAME-Web",
      script: "./gamesite/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/GAME-Web.err",
      out_file: "logs/GAME-Web.log"
    },
    /*{
      name: 'SYTH-Amazon',
      script: "./amazon/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/SYTH-Amazon.err",
      out_file: "logs/SYTH-Amazon.log"
    },*/
    {
      name: "SYTH-Steam",
      script: "./steam/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/SYTH-Steam.err",
      out_file: "logs/SYTH-Steam.log"
    },
    {
      name: "SYTH-Humble",
      script: "./humble/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/SYTH-Humble.err",
      out_file: "logs/SYTH-Humble.log"
    }
  ]
}
