var config = require('dotenv').config();
// Update with your config settings.


if (process.env.ENVIROMENT == "DEV") {
  module.exports = {
    client: 'sqlite3',
    connection: {
      filename: "./mydb.sqlite"
    },
    migrations: {
      tableName: 'migrations'
    }
  };
} else {
  module.exports = {
    client: 'mysql',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    },
    migrations: {
      tableName: 'migrations'
    }
  };   
}