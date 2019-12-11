module.exports = {
  apps: [
    {
      name: "SYTH-Core",
      script: "./app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/SYTH-Core.err",
      out_file: "logs/SYTH-Core.log",
      autorestart: false
    },
    {
      name: "Istani-Tinder",
      script: "./tinder_automation/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/Istani-Tinder.err",
      out_file: "logs/Istani-Tinder.log"
    },
    {
      name: "Istani-Bumble",
      script: "./bumble_automation/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/Istani-Bumble.err",
      out_file: "logs/Istani-Bumble.log"
    },
    {
      name: "GoS-MySQL",
      script: "./sync/app.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/GoS-MySQL.err",
      out_file: "logs/GoS-MySQL.log"
    }
  ]
};
