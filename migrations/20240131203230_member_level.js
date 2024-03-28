exports.up = function(knex) {
  return knex.schema.alterTable("vip_member", function(t) {
    t.string("level", 150).defaultTo("~833~ Crew - Missing");
  });
};

exports.down = function(knex) {};
