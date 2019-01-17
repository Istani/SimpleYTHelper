const mysql = require('mysql');
const util = require('util');

/* Checking Example File for New Data! */
var config = require('dotenv').config({path: '../.env'});
const fs = require('fs');
var config_example = "";
if (fs.existsSync("../.env")) {
  for (var attributename in config.parsed) {
    config_example += attributename + "=\r\n";
  }
  fs.writeFileSync('../.env.example', config_example);
} else {
  //fs.copyFileSync("./.env.example", ".env");
  console.log("Update .env Files first!");
  process.exit(1);
}

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error", err);
    process.exit(1);
  }
  if (connection) {
    connection.release();
  }
  return;
});

pool.query = util.promisify(pool.query);
pool.format = function (sql, inserts) {
  return mysql.format(sql, inserts);
};

module.exports = pool;
