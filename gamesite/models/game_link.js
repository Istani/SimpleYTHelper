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
  static get virtualAttributes() {
    return ['formatPrice'];
  }

  get formatPrice() {
    var ret=this.price;
    return parseFloat(ret/100).toFixed(2);
  }
}

module.exports = Game_Link;
