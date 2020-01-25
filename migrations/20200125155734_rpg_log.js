exports.up = function(knex) {
  return knex.schema.createTable("rpg_log", function(t) {
    t.string("owner", 50);
    t.string("id", 50);
    t.string("service", 50);
    t.string("display_text", 255);
    t.timestamps(true, false);

    t.primary(["owner", "id"]);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("rpg_log");
};
