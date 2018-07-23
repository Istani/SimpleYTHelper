'use strict';

var dbm;
var type;
var seed;

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
  db.changeColumn("simpleyth_oauth_secrets", "client_id", { type: 'char', length: 200, notNull: true });
  return null;
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  "version": 1
};
