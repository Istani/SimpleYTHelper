exports.up = function(knex, Promise) {
  return knex.schema.alterTable("vip_member", function(t) {
    t.string("picture", 180);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("vip_member");
};
