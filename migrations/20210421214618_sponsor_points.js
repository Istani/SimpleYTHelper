exports.up = function(knex) {
  return knex.schema.alterTable("vip_member", function(t) {
    t.integer("points", 50);
    t.integer("current", 50);
  });
};

exports.down = function(knex) {};
