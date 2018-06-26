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

exports.up = function (db, callback) {
  db.createTable('simpleyth_login', {
    email: { type: 'char', length: 50, primaryKey: true, notNull: true },
    password: { type: 'char', length: 50, notNull: true }
  }, createTimestamps);

  function createTimestamps(err) {
    if (err) { callback(err); return; }
    db.connection.query([
      'ALTER TABLE simpleyth_login',
      'ADD updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,',
      'ADD createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ',
    ].join(' '), createTrigger);
  }
  function createTrigger(err) {
    return;
    if (err) { callback(err); return; }
    db.connection.query([
      'CREATE TRIGGER usersInsert',
      'BEFORE INSERT ON simpleyth_login FOR EACH ROW SET NEW.createdAt=CURRENT_TIMESTAMP'
    ].join(' '), function (err) {
      callback(err);
    });
  }
  return null;
};

exports.down = function (db) {
  db.dropTable('simpleyth_login');
  return null;
};

exports._meta = {
  "version": 1
};
