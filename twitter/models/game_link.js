const { Model } = require("objection");
const Knex = require("knex");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

const Short_URL = require("./short_url.js");

class Game_Link extends Model {
  static get tableName() {
    return "game_link";
  }
  static get idColumn() {
    return "store, name";
  }
  static get virtualAttributes() {
    return ["formatPrice"];
  }

  get formatPrice() {
    var ret = this.price;
    return parseFloat(ret / 100).toFixed(2);
  }

  async $beforeInsert() {
    await this.$beforeUpdate();
  }

  async $beforeUpdate() {
    var temp_link = await Short_URL.gen_link(this.link);
    temp_link = "http://games-on-sale.de/s/" + temp_link;
    this.link = temp_link;
    this.updated_at = new Date().toISOString();
    this.name = this.name.toLowerCase();
  }
}

module.exports = Game_Link;
