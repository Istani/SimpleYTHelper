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
  db.createTable(tableName, {
    id: { type: 'int', length: 20, primaryKey: true, notNull: true, autoIncrement: true },
    service: { type: 'char', length: 20, notNull: true },
    user: { type: 'char', length: 100, notNull: true },

    access_token: { type: 'char', length: 200, notNull: true },
    refresh_token: { type: 'char', length: 255, notNull: true },
    expires_in: { type: 'int', length: 10, notNull: true, defaultValue: 0 },
    created: { type: 'int', length: 16, notNull: true, defaultValue: 0 },
    scope: { type: 'char', length: 255, notNull: true, defaultValue: '' },
    version: { type: 'char', length: 10, notNull: true, defaultValue: '' }
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
