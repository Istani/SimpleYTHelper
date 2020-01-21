exports.up = function(knex, Promise) {
  return knex.schema.alterTable("chat_user", function(t) {
    t.integer("msg_avg").defaultTo(0);
    t.integer("msg_sum").defaultTo(0);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("chat_user");
};
