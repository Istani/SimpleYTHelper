exports.up = function(knex, Promise) {
  return knex.schema.alterTable("broadcasts", function(t) {
    t.string("liveChatId", 100).alter();
  });
};

exports.down = function(knex, Promise) {};
