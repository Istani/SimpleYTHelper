const { Model } = require('objection');
const Knex = require('knex');

const knex = Knex(require("../../knexfile.js"));
const fs = require('fs');

Model.knex(knex);

class Steam extends Model {
  static get tableName() {
    return 'import_steam_controller';
  }
  static get idColumn() {
    return 'app_id';
  }

  static get URL_Overview() {
    return 'http://api.steampowered.com/ISteamApps/GetAppList/v0001/';
  }

  
  /*static get relationMappings() {
    const Link = require('./game_link.js');

    return {
      links: {
        relation: Model.HasManyRelation,
        modelClass: Link,
        join: {
          from: 'game_overview.name',
          to: 'game_link.name'
        }
      }
    }
  }*/
}

module.exports = Steam;
