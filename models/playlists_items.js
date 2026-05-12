const moment = require("moment");
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
    this.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
  }

  $beforeUpdate() {
    this.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
  }
}

module.exports = PlaylistItems;
