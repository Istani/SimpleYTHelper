const moment = require("moment");
const { Model } = require("objection");
const Knex = require("knex");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class advertising_own extends Model {
  static get tableName() {
    return "own_advertising";
  }
  static get idColumn() {
    return "user_id, command";
  }

  $beforeInsert() {
    this.$beforeUpdate();
    this.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
  }

  $beforeUpdate() {
    this.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
    //    if (this.output=="") {this.output=0;}
    //    if (this.output_total=="") {this.output_total=0;}
    this.output++;
    this.output_total++;
  }
}

module.exports = advertising_own;
