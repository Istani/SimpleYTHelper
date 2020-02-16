exports.up = function(knex) {
  return knex.schema.alterTable("syth_token", function(t) {
    t.boolean("is_importing").defaultTo(false);
  });
};

exports.down = function(knex) {};
