
exports.up = function (knex, Promise) {
  return knex.schema.createTable('import_steam_controller', function (t) {
    t.string('appid').notNull();
    t.string('type').notNull();
    t.boolean('ignore').notNull();
    t.timestamps(false, true);

    t.primary(['appid']);
  });
};

exports.down = function (knex, Promise) {

};
