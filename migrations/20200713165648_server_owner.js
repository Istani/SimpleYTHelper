exports.up = function(knex) {
  // chat_server
  return knex.schema.alterTable("chat_server", function(t) {
    t.string("owner", 50);
  });
};

exports.down = function(knex) {};
