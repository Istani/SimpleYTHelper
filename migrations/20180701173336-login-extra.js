'use strict';

var dbm;
var type;
var seed;

var tableName = "simpleyth_login";

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
  db.addColumn(tableName, "newsletter", { type: 'boolean', notNull: true, defaultValue: false });
  db.addColumn(tableName, "activation_code", { type: 'char', length: 200, notNull: true });
  db.addColumn(tableName, "login_count", { type: 'bigint', notNull: true });
  db.addColumn(tableName, "login_fail", { type: 'smallint', notNull: true });
  return null;
};

exports.down = function (db) {
  db.removeColumn(tableName, "newsletter");
  db.removeColumn(tableName, "activation_code");
  db.removeColumn(tableName, "login_count");
  db.removeColumn(tableName, "login_fail");
  return null;
};

exports._meta = {
  "version": 1
};
