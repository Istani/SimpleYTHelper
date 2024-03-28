module.exports = {
  apps: [
    {
      name: "SYTH-Backup",
      script: "./cronjob/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/SYTH-Backup.err",
      out_file: "logs/SYTH-Backup.log"
    },
    {
      name: "SYTH-Web",
      script: "./website/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/SYTH-Web.err",
      out_file: "logs/SYTH-Web.log"
    },
    {
      name: "SYTH-Rpg",
      script: "./rpg/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/SYTH-Rpg.err",
      out_file: "logs/SYTH-Rpg.log"
    },
    {
      name: "SYTH-Discord",
      script: "./discord/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 2000,
      error_file: "logs/SYTH-Discord.err",
      out_file: "logs/SYTH-Discord.log"
    },
    {
      name: "SYTH-YouTube",
      script: "./youtube/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 1000,
      error_file: "logs/SYTH-YouTube.err",
      out_file: "logs/SYTH-YouTube.log"
    },
    {
      name: "SYTH-Twitch",
      script: "./twitch/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 1000,
      error_file: "logs/SYTH-Twitch.err",
      out_file: "logs/SYTH-Twitch.log"
    },
    {
      name: "SYTH-Twitter",
      script: "./twitter/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 1000,
      error_file: "logs/SYTH-Twitter.err",
      out_file: "logs/SYTH-Twitter.log"
    },
    {
      name: "SYTH-Commands",
      script: "./chatcommands/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 1000,
      error_file: "logs/SYTH-Commands.err",
      out_file: "logs/SYTH-Commands.log"
    },
    {
      name: "GAME-Web",
      script: "./gamesite/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/GAME-Web.err",
      out_file: "logs/GAME-Web.log"
    },
    {
      name: "GAME-Sales",
      script: "./gamecheck/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/GAME-Sales.err",
      out_file: "logs/GAME-Sales.log"
    },
    /*{
      name: "GAME-CustomImport",
      script: "./test/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/GAME-CustomImport.err",
      out_file: "logs/GAME-CustomImport.log"
    },*/
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
    },
    {
      name: "SYTH-GOG",
      script: "./gog/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/SYTH-GOG.err",
      out_file: "logs/SYTH-GOG.log"
    },
    {
      name: "SYTH-Epic",
      script: "./epicstore/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/SYTH-Epic.err",
      out_file: "logs/SYTH-Epic.log"
    },
    {
      name: "Istani-Achievements",
      script: "./metagamerscore/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/Istani-Achievements.err",
      out_file: "logs/Istani-Achievements.log"
    },
    /*{
      name: "Istani-Tinder",
      script: "./tinder_automation/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/Istani-Tinder.err",
      out_file: "logs/Istani-Tinder.log"
    }*/
    {
      name: "SYTH-YT-API",
      script: "./youtube/server.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/SYTH-YT-API.err",
      out_file: "logs/SYTH-YT-API.log"
    },
    {
      name: "SYTH-Pokemon",
      script: "./pkmn/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/SYTH-Pokemon.err",
      out_file: "logs/SYTH-Pokemon.log"
    }
  ]
};
