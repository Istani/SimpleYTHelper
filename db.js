const mysql = require('mysql');
const util = require('util');

const pool = mysql.createPool({
  connectionLimit: 100,
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

module.exports = pool;