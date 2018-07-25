'use strict';

var dbm;
var type;
var seed;

var tableName = "game_overview";

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
  db.createTable(tableName, {
    type: { type: 'char', length: 30, notNull: true },
    name: { type: 'char', length: 100, primaryKey: true, notNull: true },
    description: { type: 'text', notNull: true },
    banner: { type: 'char', length: 200, notNull: true }
  }, createTimestamps);

  function createTimestamps(err) {
    db.connection.query([
      'ALTER TABLE', tableName,
      'ADD updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,',
      'ADD createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ',
    ].join(' '), createTrigger);
  }
  function createTrigger(err) {
    db.connection.query([
      'CREATE TRIGGER ' + tableName + '_update',
      'BEFORE INSERT ON', tableName, 'FOR EACH ROW SET NEW.createdAt=CURRENT_TIMESTAMP'
    ].join(' '), function (err) {
      console.log(err);
    });
  }
  return null;
};

exports.down = function (db) {
  db.dropTable(tableName);
  return null;
};

exports._meta = {
  "version": 1
};
