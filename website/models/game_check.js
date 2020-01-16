const { Model } = require("objection");
const Knex = require("knex");

const knex = Knex(require("../knexfile.js"));
const fs = require("fs");

Model.knex(knex);

class GameCheck extends Model {
  static get tableName() {
    return "game_check";
  }
  static get idColumn() {
    return "category, game";
  }

  static get virtualAttributes() {
    return ["banner"];
  }
  get banner() {
    if (this.details == null) {
      return "";
    }
    if (this.details == undefined) {
      return "";
    }
    return this.details.banner;
  }

  static get relationMappings() {
    const Game = require("./game.js");

    return {
      details: {
        relation: Model.HasOneRelation,
        modelClass: Game,
        join: {
          from: "game_check.game",
          to: "game_overview.name"
        }
      }
    };
  }

  static get DeleteDate() {
    var date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString();
  }

  $beforeInsert() {
    this.$beforeUpdate();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
    this.game = this.game.toLowerCase();
  }
}

module.exports = GameCheck;
