exports.up = function(knex, Promise) {
  return knex.schema.alterTable("chat_user", function(t) {
    t.dropColumn("picture");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable("chat_user", function(t) {
    t.string("picture", 300).defaultTo("");
  });
};
