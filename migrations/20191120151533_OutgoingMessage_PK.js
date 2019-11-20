exports.up = function(knex) {
  return knex.schema.alterTable("outgoing_messages", function(t) {
    t.increments("id").primary();
  });
};

exports.down = function(knex) {};
