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
  db.removeColumn(tableName, "expires_in");
  db.removeColumn(tableName, "created");
  db.removeColumn(tableName, "scope");
  db.removeColumn(tableName, "version");
  return null;
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  "version": 1
};
