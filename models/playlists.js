const moment = require("moment");
const { Model } = require("objection");
const Knex = require("knex");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Playlist extends Model {
  static get tableName() {
    return "playlists";
  }
  static get idColumn() {
    return "service, owner, pl_id";
  }

  $beforeInsert() {
    this.$beforeUpdate();
    this.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
  }

  $beforeUpdate() {
    this.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
  }
}

module.exports = Playlist;
