exports.up = function(knex, Promise) {
  return knex.schema.alterTable("chat_user", function(t) {
    t.string("profile_picture", 300).defaultTo("");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable("chat_user", function(t) {
    t.dropColumn("profile_picture");
  });
};
