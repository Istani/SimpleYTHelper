var mysql = require("mysql");
const private_settings  =require('./private_settings.json');

var connection = mysql.createConnection({
  host     : private_settings.mysql_host,
  user     : private_settings.mysql_user,
  password : private_settings.mysql_pass,
  database : private_settings.mysql_base
});

connection.connect();

connection.query('SELECT * FROM authtoken', function(err, rows, fields) {
  if (err) throw err;
  
  console.log('The solution is: ', rows[0].id);
});

connection.end();
