var mysql = require('mysql');
var async = require('async');

var pool;

exports.connect = function (mysql_host, mysql_user, mysql_password, mysql_database, done) {
  pool = mysql.createPool({
    host: mysql_host,
    user: mysql_user,
    password: mysql_password,
    database: mysql_database
  });
  done();
};

exports.get = function () {
  return pool;
};

/*
exports.fixtures = function (data) {
  if (!pool) return done(new Error('Missing database connection.'));
  var names = Object.keys(data.tables);
  async.each(names, function (name, cb) {
    async.each(data.tables[name], function (row, cb) {
      var keys = Object.keys(row);
      var values = keys.map(function (key) { return "'" + row[key] + "'" });

      pool.query('INSERT INTO ' + name + ' (' + keys.join(',') + ') VALUES (' + values.join(',') + ')', cb);
    }, cb);
  }, done);
};

exports.drop = function (tables, done) {
  if (!pool) return done(new Error('Missing database connection.'));
  async.each(tables, function (name, cb) {
    pool.query('DELETE * FROM ' + name, cb);
  }, done);
};
*/