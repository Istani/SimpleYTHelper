const moment = require("moment");
const { Model } = require("objection");
const Knex = require("knex");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Game_Merch extends Model {
  static get tableName() {
    return "game_merch";
  }
  static get idColumn() {
    return "store, name, product";
  }
  static get virtualAttributes() {
    return ["formatPrice"];
  }

  get formatPrice() {
    var ret = this.price;
    return parseFloat(ret / 100).toFixed(2);
  }

  $beforeInsert() {
    this.$beforeUpdate();
  }

  $beforeUpdate() {
    this.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
    this.name = this.name.toLowerCase();
  }
}

module.exports = Game_Merch;
