const { Model } = require("objection");
const Knex = require("knex");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Char extends Model {
  static get tableName() {
    return "rpg_char";
  }
  static get idColumn() {
    return "owner, id";
  }

  $beforeInsert() {
    this.$beforeUpdate();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }

  static get relationMappings() {
    const Inventory = require("./rpg_inventory.js");

    return {
      inventory: {
        relation: Model.HasManyRelation,
        modelClass: Inventory,
        join: {
          from: "rpg_char.id",
          to: "rpg_inventory.char_id"
        }
      }
    };
  }
}

module.exports = Char;
