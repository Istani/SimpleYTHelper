process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("===");
console.log();

const puppeteer = require("puppeteer");
const sleep = require("await-sleep");
const fs = require("fs");
const request = require("request");

const Games = require("./models/game.js");
const GameLinks = require("./models/game_link.js");

let STORE_NAME = "Epic";
let sleeptime = 1000;

async function get_Games() {
  const query = `query catalogQuery($category:String,$count:Int,$country:String!,$keywords: String,$locale:String,$namespace:String!,$sortBy:String,$sortDir:String,$start:Int,$tag:String) {
    Catalog {
      catalogOffers(namespace: $namespace,locale: $locale,params: {count: $count,country: $country,category: $category,keywords: $keywords,sortBy: $sortBy,sortDir: $sortDir,start: $start,tag: $tag}) {
        elements {
          isFeatured
          collectionOfferIds
          
          title
          id
          namespace
          description
          keyImages {
            type
            url
          }
          seller {
            id
            name
          }
          productSlug
          urlSlug
          items {
            id
            namespace
          }
          customAttributes {
            key
            value
          }
          categories {
            path
          }
          price(country: $country) {
            totalPrice {
              discountPrice
              originalPrice
              voucherDiscount
              discount
              fmtPrice(locale: $locale) {
                originalPrice
                discountPrice
                intermediatePrice
              }
            }
            lineOffers {
              appliedRules {
                id
                endDate
              }
            }
          }
          linkedOfferId
          linkedOffer {
            effectiveDate
            customAttributes {
              key
              value
            }
          }
          
        }
        paging {
          count,
          total
        }
      }
    }
  }`;

  const variables = {
    category: "games|bundles",
    count: 1000,
    country: "DE",
    keywords: "",
    locale: "de",
    namespace: "epic",
    sortBy: "effectiveDate",
    sortDir: "DESC",
    start: 0,
    tag: ""
  };
  const data = { query: query, variables: variables };
  fs.writeFileSync("tmp/request.json", JSON.stringify(data, null, 2));

  request.post(
    "https://graphql.epicgames.com/graphql",
    { json: data },
    async function(error, response, body) {
      fs.writeFileSync(
        "tmp/offers.json",
        JSON.stringify(body.data.Catalog.catalogOffers.elements, null, 2)
      );
      //console.log(body.data.Catalog.catalogOffers.elements.length, "Games");
      for (
        let index = 0;
        index < body.data.Catalog.catalogOffers.elements.length;
        index++
      ) {
        const element = body.data.Catalog.catalogOffers.elements[index];
        //console.log(element);

        var ename = element.title;
        // https://www.epicgames.com/store/de/product/uno/home?epic_affiliate=defender833&epic_gameId=ca93b6d41a4e41af864942d8f0a2a826#
        var elink = "https://www.epicgames.com/store/de/product/";
        elink = elink + element.productSlug;
        var gameId = element.customAttributes.find(
          e => e.key == "com.epicgames.app.offerNs"
        );
        elink = elink + "?epic_gameId=" + gameId.value;
        elink = elink + "&epic_affiliate=defender833"; // TODO: Own Epic Affiliate

        // ?epic_gameId=ca93b6d41a4e41af864942d8f0a2a826
        // &epic_affiliate=defender833
        var store_data = {};
        store_data.store = STORE_NAME;
        store_data.link = elink;
        store_data.name = Games.getEncodedName(ename);
        store_data.price = parseInt(element.price.totalPrice.discountPrice);
        if (element.price.totalPrice.originalPrice == 0) {
          store_data.discount = 0;
        } else {
          store_data.discount = parseInt(
            100 -
              (element.price.totalPrice.discountPrice /
                element.price.totalPrice.originalPrice) *
                100
          );
        }

        var check_store = await GameLinks.query()
          .where("name", store_data.name)
          .where("store", store_data.store);
        if (check_store.length == 0) {
          console.log("New Game:", ename);
          await GameLinks.query().insert(store_data);
        } else {
          console.log("Old Game:", store_data);
          store_data.created_at = check_store[0].created_at;
          await GameLinks.query()
            .patch(store_data)
            .where("name", store_data.name)
            .where("store", store_data.store);
        }
        await sleep(sleeptime);
      }
      setInterval(() => {
        get_Games();
      }, 6 * 60 * 60 * 1000); // 6*1 Stunde warten bevor Start
    }
  );
}
get_Games();
