const { Model } = require("objection");
const Knex = require("knex");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Game_Genre extends Model {
  static get tableName() {
    return "game_genres";
  }
  static get idColumn() {
    return "name, genre";
  }

  $beforeInsert() {
    this.$beforeUpdate();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
    this.name = this.name.toLowerCase();
    this.genre = this.genre.toLowerCase();
  }
}

module.exports = Game_Genre;
