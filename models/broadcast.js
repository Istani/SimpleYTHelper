const moment = require("moment");
const { Model } = require("objection");
const Knex = require("knex");
const sanitizeLegacyMysqlText = require("../youtube/lib/legacy-mysql-text.js");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class broadcast extends Model {
  static get tableName() {
    return "broadcasts";
  }
  static get idColumn() {
    return "service, owner, b_id";
  }

  $beforeInsert() {
    this.$beforeUpdate();
    this.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
  }

  $beforeUpdate() {
    this.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
    if (this.b_title !== undefined) {
      this.b_title = sanitizeLegacyMysqlText(this.b_title);
    }
  }
}

module.exports = broadcast;
