const moment = require("moment");
const { Model } = require("objection");
const Knex = require("knex");
const emoji = require("node-emoji");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Logs extends Model {
  static get tableName() {
    return "rpg_log";
  }
  static get idColumn() {
    return "owner, id";
  }

  $beforeInsert() {
    this.$beforeUpdate();
  }

  $beforeUpdate() {
    //this.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
    this.display_text = emoji.unemojify(this.display_text);
  }
}

module.exports = Logs;
