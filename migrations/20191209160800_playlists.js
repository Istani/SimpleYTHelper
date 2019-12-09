exports.up = function(knex) {
  return knex.schema.createTable("playlists", function(t) {
    t.string("service", 50);
    t.string("owner", 50);
    t.string("pl_id", 50);
    t.string("pl_title", 50);

    t.string("publishedAt", 50);
    t.string("description", 200);

    t.timestamps(true, false);

    t.primary(["service", "owner", "pl_id"]);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("playlists");
};
