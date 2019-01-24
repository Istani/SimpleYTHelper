exports.up = function (knex, Promise) {
  return knex.schema.createTable('game_merch', function (t) {
    t.string('store').notNull();
    t.string('name').notNull();
    t.string('product').notNull();
    t.string('link').notNull();
    t.string('display_name').notNull().defaultTo('');
    t.string('picture').notNull().defaultTo('');
    t.integer('price').notNull().defaultTo(0);
    t.timestamps(false, true);

    t.primary(['store', 'name', 'product']);
  });
};

exports.down = function (knex, Promise) {

};

