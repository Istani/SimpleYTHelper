'use strict';

var dbm;
var type;
var seed;

var tableName = "simpleyth_login_token";

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
  db.addColumn(tableName, "cronjob", { type: 'boolean', notNull: true, defaultValue: false });
  db.changeColumn(tableName, "access_token", { type: 'char', length: 200, notNull: true });
  return null;
};

exports.down = function (db) {
  db.removeColumn(tableName, "cronjob");
  return null;
};

exports._meta = {
  "version": 1
};
