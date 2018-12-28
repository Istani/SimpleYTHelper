const { Model } = require('objection');
const Knex = require('knex');

const knex = Knex(require("../../knexfile.js"));

Model.knex(knex);

class Game extends Model {
  static get tableName() {
    return 'game_overview';
  }
  static get idColumn() {
    return 'name';
  }
/*
  static get virtualAttributes() {
    return ['fullName'];
  }

  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
*/
  static get relationMappings() {
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
  }
}

module.exports = Game;
