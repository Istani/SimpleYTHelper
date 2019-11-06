exports.up = function(knex, Promise) {
  return knex.schema.createTable("import_steam_controller", function(t) {
    t.string("appid", 50).notNull();
    t.string("type").notNull();
    t.boolean("ignore").notNull();
    t.timestamps(true, false);

    t.primary(["appid"]);
  });
};

exports.down = function(knex, Promise) {};
