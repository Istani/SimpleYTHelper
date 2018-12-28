const { Model } = require('objection');
const Knex = require('knex');

const knex = Knex(require("../../knexfile.js"));

Model.knex(knex);

class Game_Link extends Model {
  static get tableName() {
    return 'game_link';
  }
  static get idColumn() {
    return 'store, name';
  }
}

module.exports = Game_Link;
