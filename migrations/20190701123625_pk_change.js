
exports.up = function (knex, Promise) {
  return knex.schema.alterTable('simpleyth_oauth_secrets', function (t) {
    t.string('service', 50).notNull().alter();
  }).then(knex.schema.alterTable('simpleyth_oauth_botcredentials', function (t) {
    t.string('service', 50).notNull().alter();
  }).then(knex.schema.alterTable('game_overview', function (t) {
    t.string('name', 200).notNull().alter();
  }).then(knex.schema.alterTable('game_link', function (t) {
    t.string('store', 50).notNull().alter();
    t.string('name', 200).notNull().alter();
  }).then(knex.schema.alterTable('channel', function (t) {
    t.string('user_id', 50).notNull().alter();
    t.string('service', 50).notNull().alter();
    t.string('channel_id', 50).notNull().alter();
  }).then(knex.schema.alterTable('game_merch', function (t) {
    t.string('store', 50).notNull().alter();
    t.string('name', 200).notNull().alter();
    t.string('product', 50).notNull().alter();
  }).then(knex.schema.alterTable('chat_message', function (t) {
    t.string('service', 50).notNull().alter();
    t.string('server', 50).notNull().alter();
    t.string('room', 50).notNull().alter();
    t.string('id', 50).notNull().alter();
  }).then(knex.schema.alterTable('chat_room', function (t) {
    t.string('service', 50).notNull().alter();
    t.string('server', 50).notNull().alter();
    t.string('room', 50).notNull().alter();
  }).then(knex.schema.alterTable('chat_server', function (t) {
    t.string('service', 50).notNull().alter();
    t.string('server', 50).notNull().alter();
  }).then(knex.schema.alterTable('chat_user', function (t) {
    t.string('service', 50).notNull().alter();
    t.string('server', 50).notNull().alter();
    t.string('user', 50).notNull().alter();
  }).then(knex.schema.alterTable('game_check', function (t) {
    t.string('category', 50).notNull().alter();
    t.string('game', 200).notNull().alter();
  }).then()))))))))));
};

exports.down = function (knex, Promise) {

};
