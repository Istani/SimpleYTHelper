
exports.up = function (knex, Promise) {
  return knex.schema.createTable('channel', function (t) {
    t.string('user_id').notNull();
    t.string('service').notNull();
    t.string('channel_id').notNull();
    t.string('channel_title').notNull();
    t.text('description').notNull();
    t.datetime('start_date').notNull();
    t.string('thumbnail').notNull();
    t.string('banner').notNull();
    t.string('main_playlist').notNull();

    t.integer('views').notNull();
    t.integer('subscriber').notNull();
    t.integer('videos').notNull();

    t.timestamps(false, true);

    t.primary(['user_id', 'service', 'channel_id']);
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('channel');
};
