
exports.up = function (knex, Promise) {
  return knex.schema.alterTable('simpleyth_login', function (t) {
    t.string('email', 255).notNull().alter();
  }).then(knex.schema.alterTable('simpleyth_oauth_secrets', function (t) {
    t.string('service', 255).notNull().alter();
  }).then(knex.schema.alterTable('simpleyth_oauth_botcredentials', function (t) {
    t.string('service', 255).notNull().alter();
  }).then(knex.schema.alterTable('game_overview', function (t) {
    t.string('name', 255).notNull().alter();
  }).then(knex.schema.alterTable('game_link', function (t) {
    t.string('store', 255).notNull().alter();
    t.string('name', 255).notNull().alter();
  }).then(knex.schema.alterTable('channel', function (t) {
    t.string('user_id', 255).notNull().alter();
    t.string('service', 255).notNull().alter();
    t.string('channel_id', 255).notNull().alter();
  }).then(knex.schema.alterTable('game_merch', function (t) {
    t.string('store', 255).notNull().alter();
    t.string('name', 255).notNull().alter();
    t.string('product', 255).notNull().alter();
  }).then(knex.schema.alterTable('chat_message', function (t) {
    t.string('service', 255).notNull().alter();
    t.string('server', 255).notNull().alter();
    t.string('room', 255).notNull().alter();
    t.string('id', 255).notNull().alter();
  }).then(knex.schema.alterTable('chat_room', function (t) {
    t.string('service', 255).notNull().alter();
    t.string('server', 255).notNull().alter();
    t.string('room', 255).notNull().alter();
  }).then(knex.schema.alterTable('chat_server', function (t) {
    t.string('service', 255).notNull().alter();
    t.string('server', 255).notNull().alter();
  }).then(knex.schema.alterTable('chat_user', function (t) {
    t.string('service', 255).notNull().alter();
    t.string('server', 255).notNull().alter();
    t.string('user', 255).notNull().alter();
  }).then(knex.schema.alterTable('game_check', function (t) {
    t.string('category', 255).notNull().alter();
    t.string('game', 255).notNull().alter();
  }).then())))))))))));
};

exports.down = function (knex, Promise) {

};
