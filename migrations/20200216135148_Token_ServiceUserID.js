exports.up = function(knex) {
  return knex.schema.alterTable("syth_token", function(t) {
    t.string("service_user");
  });
};

exports.down = function(knex) {};
