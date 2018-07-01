'use strict';

var dbm;
var type;
var seed;

var tableName = "simpleyth_oauth_botcredentials";

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  db.addColumn(tableName, "login", { type: 'char', length: 50, notNull: true });
  db.addColumn(tableName, "password", { type: 'char', length: 100, notNull: true });
  return null;
};

exports.down = function (db) {
  db.removeColumn(tableName, "login");
  db.removeColumn(tableName, "password");
  return null;
};

exports._meta = {
  "version": 1
};
