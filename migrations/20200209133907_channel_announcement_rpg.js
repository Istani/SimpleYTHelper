exports.up = function(knex) {
  return knex.schema.alterTable("chat_room", function(t) {
    t.boolean("is_rpg").defaultTo(false);
    t.boolean("is_announcement").defaultTo(false);
  });
};

exports.down = function(knex) {};
