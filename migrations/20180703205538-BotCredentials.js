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
  db.addColumn(tableName, "access_token", { type: 'char', length: 200, notNull: true });
  db.addColumn(tableName, "refresh_token", { type: 'char', length: 255, notNull: true });
  db.addColumn(tableName, "expires_in", { type: 'int', length: 10, notNull: true, defaultValue: 0 });
  db.addColumn(tableName, "created", { type: 'int', length: 16, notNull: true, defaultValue: 0 });
  return null;
};

exports.down = function (db) {
  db.removeColumn(tableName, "access_token");
  db.removeColumn(tableName, "refresh_token");
  db.removeColumn(tableName, "expires_in");
  db.removeColumn(tableName, "created");
  return null;
};

exports._meta = {
  "version": 1
};
