exports.up = function(knex, Promise) {
  return knex.schema.alterTable("game_overview", function(t) {
    //t.string('name', 200).notNull().alter();
  });
};

exports.down = function(knex, Promise) {};
