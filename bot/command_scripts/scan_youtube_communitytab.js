const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const moment=require("moment");

var self = module.exports = {
  init: function (MySQL) {
    mysql=MySQL;
  },
  check_permission: function (message_row, SendFunc, NewMessageFunc) {
    var permissions=false;
    
    if (message_row.user=="-1") {
      permissions=true;
    }
    
    permissions=true; // Fake Recht!
    
    if (permissions==false) {
      SendFunc(message_row.user+ " du hast keine Rechte den Befehl auszuführen!\r\n" + message_row.message);
    } else {
      self.execute(message_row, SendFunc, NewMessageFunc);
    }
  },
  execute: function (message_row, SendFunc, NewMessageFunc) {
    var parameter = message_row.message.split(" ")[1];
    url = "https://www.youtube.com/channel/" + parameter + "/community";
    start_scan();
  },
};
var url = "";

function start_scan() {
  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await console.log(url);
    await page.goto(url);
    
    await page.waitFor(10000);
    
    const dimensions = await page.evaluate(() => {
      return {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        deviceScaleFactor: window.devicePixelRatio,
        html: document.documentElement.outerHTML
      };
    });
    
    await scan_handle_html(dimensions.html);
    
    await browser.close();
  })();
};

function scan_handle_html(html) {
  var $ = cheerio.load(html);
  $('#body.ytd-backstage-post-renderer').filter(function() {
    var data = $(this);
    scan_dismantle_entry(data.html());
  });
}

function scan_dismantle_entry(html) {
  var $ = cheerio.load(html);
  var newEntry={};
  var title="";
  
  var temp_link = cheerio.load($('#published-time-text').html());
  newEntry.link="https://www.youtube.com" + temp_link('a').attr('href').replace("'","");
  newEntry.text=$('#content-text').text().replace("'","");
  entry_mysql(newEntry);
}


function entry_mysql(entry) {
  var SQL = "SELECT * FROM youtube_communitytab WHERE youtube_link='"+entry.link+"'";
  mysql.query(SQL, function (err, rows) {
    if (err != null) {
      console.log(SQL);
      console.log(err);
      return;
    }
    var SQL_FELDER="";
    SQL_FELDER+="youtube_link='"+entry.link+"', ";
    SQL_FELDER+="youtube_text='"+entry.text+"' ";
    if (rows.length==0) {
      var SQL2="INSERT INTO youtube_communitytab SET "+SQL_FELDER;
    } else {
      var SQL2="UPDATE youtube_communitytab SET "+SQL_FELDER+" WHERE youtube_link='"+entry.link+"'";
    }
    mysql.query(SQL2, function (err2, rows2) {
      if (err2 != null) {
        console.log(SQL2);
        console.log(err2);
        return;
      }
    });
  });
}
