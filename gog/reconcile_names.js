// One-time repair for GOG links created with a slug-based game ID.
// GOG's title is the shared canonical key used by Steam, Epic and the web app.
process.chdir(__dirname);
const Games = require("./models/game.js");
const Links = require("./models/game_link.js");

async function run() {
  const knex = Links.knex();
  const gogLinks = await Links.query().where("store", "GOG");
  let migrated = 0;
  let merged = 0;

  await knex.transaction(async trx => {
    for (const link of gogLinks) {
      const source = await Games.query(trx).findById(link.name);
      if (!source || !source.display_name) continue;
      const canonical = Games.getEncodedName(source.display_name);
      if (canonical === link.name) continue;

      const duplicate = await Links.query(trx)
        .where("store", "GOG")
        .where("name", canonical)
        .first();
      if (duplicate) {
        await trx("game_link")
          .where("store", "GOG")
          .where("name", link.name)
          .delete();
        merged++;
      } else {
        await trx("game_link")
          .where("store", "GOG")
          .where("name", link.name)
          .update({ name: canonical });
        migrated++;
      }

      const target = await Games.query(trx).findById(canonical);
      if (target) {
        await Games.query(trx).deleteById(source.name);
      } else {
        await Games.query(trx)
          .patch({ name: canonical })
          .where("name", source.name);
      }
    }
  });
  console.log(JSON.stringify({ scanned: gogLinks.length, migrated, merged }));
}
run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error.stack || error);
    process.exit(1);
  });
