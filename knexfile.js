var envpath = __dirname + "/.env";
console.log("Settingspath:", envpath);

var config = require("dotenv").config({ path: envpath });
// Update with your config settings.

module.exports = {
  client: "mysql",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
    //charset: 'utf8mb4_unicode_ci'
  },
  migrations: {
    tableName: "migrations"
  }
};
