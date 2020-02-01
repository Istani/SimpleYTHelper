const { Model } = require("objection");
const Knex = require("knex");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Char extends Model {
  static get tableName() {
    return "rpg_inventory";
  }
  static get idColumn() {
    return "id";
  }

  $beforeInsert() {
    this.$beforeUpdate();
  }

  $beforeUpdate() {
    //this.updated_at = new Date().toISOString();
  }
}

module.exports = Char;
