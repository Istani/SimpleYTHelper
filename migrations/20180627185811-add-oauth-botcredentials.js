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
  db.createTable('simpleyth_oauth_botcredentials', {
    service: { type: 'char', length: 20, primaryKey: true, notNull: true },
    user_token: { type: 'char', length: 100, notNull: true }
  }, createTimestamps);

  function createTimestamps(err) {
    db.connection.query([
      'ALTER TABLE simpleyth_oauth_botcredentials',
      'ADD updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,',
      'ADD createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ',
    ].join(' '), createTrigger);
  }
  function createTrigger(err) {
    db.connection.query([
      'CREATE TRIGGER oauthbotcredentialInsert',
      'BEFORE INSERT ON simpleyth_oauth_botcredentials FOR EACH ROW SET NEW.createdAt=CURRENT_TIMESTAMP'
    ].join(' '), function (err) {
      console.log(err);
    });
  }
  return null;
};

exports.down = function (db) {
  db.dropTable('simpleyth_oauth_botcredentials');
  return null;
};

exports._meta = {
  "version": 1
};
