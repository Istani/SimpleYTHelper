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
  db.createTable('simpleyth_oauth_secrets', {
    service: { type: 'char', length: 20, primaryKey: true, notNull: true },
    client_id: { type: 'char', length: 100, notNull: true },
    client_secret: { type: 'char', length: 100, notNull: true },
    url_authorize: { type: 'char', length: 50, notNull: true },
    url_token: { type: 'char', length: 50, notNull: true },
    app_scope: { type: 'char', length: 255, notNull: true }
    // response_type="code"
    // access_type="offline"
  }, createTimestamps);

  function createTimestamps(err) {
    db.connection.query([
      'ALTER TABLE simpleyth_oauth_secrets',
      'ADD updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,',
      'ADD createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ',
    ].join(' '), createTrigger);
  }
  function createTrigger(err) {

    db.connection.query([
      'CREATE TRIGGER oauthsecretsInsert',
      'BEFORE INSERT ON simpleyth_oauth_secrets FOR EACH ROW SET NEW.createdAt=CURRENT_TIMESTAMP'
    ].join(' '), function (err) {
      console.log(err);
    });
  }
  return null;
};

exports.down = function (db) {
  db.dropTable('simpleyth_oauth_secrets');
  return null;
};

exports._meta = {
  "version": 1
};
