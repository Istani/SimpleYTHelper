exports.up = function(knex) {
  return knex.schema.createTable("playlists_item", function(t) {
    t.string("service", 50);
    t.string("owner", 50);
    t.string("pl_id", 50);
    t.integer("position");
    t.string("video_id", 50);

    t.timestamps(true, false);

    t.primary(["service", "owner", "pl_id", "position"]);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("playlists_item");
};
