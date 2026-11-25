const moment = require("moment");
const { Model } = require("objection");
const Knex = require("knex");
const knex = Knex(require("../knexfile.js"));
Model.knex(knex);
class SythDiscordGuild extends Model {
  static get tableName() {
    return "syth_discord_guild";
  }
  static get idColumn() {
    return "guild_id";
  }
  $beforeInsert() {
    this.$beforeUpdate();
  }
  $beforeUpdate() {
    this.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
  }
}
module.exports = SythDiscordGuild;
