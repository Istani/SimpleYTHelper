exports.up = function(knex) {
  return knex.schema.createTable("own_advertising", function(t) {
    t.string("user_id", 50);
    t.string("command", 150);

    t.string("output").defaultTo(0);
    t.string("output_total").defaultTo(0);

    t.timestamps(false, false);
    t.primary(["user_id", "command"]);
  });
};

exports.down = function(knex) {
  return kenx.schema.dropTable("own_advertising");
};
