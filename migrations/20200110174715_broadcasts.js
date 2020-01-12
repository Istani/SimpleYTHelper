exports.up = function(knex) {
  return knex.schema.createTable("broadcasts", function(t) {
    t.string("service", 50);
    t.string("owner", 50);
    t.string("b_id", 50);
    t.string("b_title", 50);

    t.string("actualStartTime", 50);
    t.string("actualEndTime", 50);

    t.string("liveChatId", 50);

    t.timestamps(false, false);

    t.primary(["service", "owner", "b_id"]);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("broadcasts");
};
