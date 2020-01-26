const { Model } = require("objection");
const Knex = require("knex");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class PlaylistItems extends Model {
  static get tableName() {
    return "playlists_item";
  }
  static get idColumn() {
    return "service, owner, pl_id, position";
  }

  $beforeInsert() {
    this.$beforeUpdate();
    this.created_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

module.exports = PlaylistItems;
