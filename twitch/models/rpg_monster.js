const { Model } = require("objection");
const Knex = require("knex");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Monster extends Model {
  static get tableName() {
    return "rpg_monster";
  }
  static get idColumn() {
    return "owner";
  }

  $beforeInsert() {
    this.$beforeUpdate();
  }

  $beforeUpdate() {
    //this.updated_at = new Date().toISOString();
  }
}

module.exports = Monster;
