const { Model } = require("objection");
const Knex = require("knex");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

const shortid = require("shortid");

class Short_URL extends Model {
  static get tableName() {
    return "short_url";
  }
  static get idColumn() {
    return "code";
  }
  static async gen_code() {
    var is_ok = false;
    var code = "";
    while (!is_ok) {
      code = shortid.generate();
      var check = await Short_URL.query().where("code", code);
      if (check.length == 0) {
        is_ok = true;
      } else {
        console.error("Duplicate Code: " + code);
      }
    }
    return code;
  }
  static async gen_link(url, user) {
    if (user === undefined) {
      user = 0;
    }
    var is_ok = false;
    var check;
    while (!is_ok) {
      check = await Short_URL.query()
        .where("url", url)
        .where("user", user);
      if (check.length == 0) {
        var new_link = {};
        new_link.code = await Short_URL.gen_code();
        new_link.url = url;
        new_link.user = user;
        console.log("New Shortlink", new_link);
        await Short_URL.query().insert(new_link);
      } else {
        is_ok = true;
      }
    }
    return check[0].code;
  }
  static async express(req, res, next) {
    const urlCode = req.params.code;
    console.log("Request", urlCode);
    var check = await Short_URL.query().where("code", urlCode);
    if (check.length == 0) {
      next();
      return;
    }
    //await Short_URL.query().patch(check[0]);
    return res.redirect(check[0].url);
  }

  $beforeInsert() {
    this.$beforeUpdate();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

module.exports = Short_URL;
