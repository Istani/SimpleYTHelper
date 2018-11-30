var config = require('dotenv').config();
const puppeteer = require('puppeteer');

(async function main() {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://www.zod-clan.de', {
      timeout: 6000000
    });

    await page.$eval('input[name=ws_user]', el => el.value = process.env.ZOD_USER);
    await page.$eval('input[name=pwd]', el => el.value = process.env.ZOD_PASS);
    await page.$eval('input[name=submit]', el => el.click());
    await page.waitForNavigation();

    await page.goto('https://www.zod-clan.de/news.php?action=new', {
      timeout: 6000000
    });

    // They dont want to Post Humble Things, so i am not sure what to Post!


    /*
    [COLOR=#0000FF]
    <iframe width="516" height="315" src="https://www.youtube.com/embed/M9FGaan35s0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

    [toggle=Versionen:]
    Standard
    Tricentennial Edition:
      -Rolley Token: Erleichtert die Vorbereitung auf die Tage im Wasteland
      -Tricentennial-Powerrüstungs-Anpassung für die Modelle: T-51, T-45, T-60 & X-01
      -Tricentennial-Waffen-Anpassung für die 10MM-Pistole, das Beil und das Lasergewehr
      -Unfassbar schicker Vault-Boy-Maskottchenkopf, Patriotisches Uncle-Sam-Outfit
      -Feierliches Vault-Boy-Gruß-Emote
      -Hochwertige Tricentennial-Werkstatt-Poster
      -Tricentennial-Gedenk-Fotorahmen
    Collectors Edition[/toggle]

    Alle Vorbesteller erhalten Zugang zur Beta (exclusiv nur über Vorbestellung möglich).

    Release: 14.11.2018

    [toggle=Mehr S.P.E.C.I.A.L. Infos gibt es hier...]
    Eines vorweg, ich bin ein riesen Fan der Fallout Reihe und habe dort etliche Minuten,Stunden,Tage.... an Spielpraxis gesammelt ([URL]https://www.youtube.com/watch?v=qx-BvJSIetA[/URL]). Schreibe diesen Text als subjektiv. Bethesda sorgt 
    immer für das perfekte Ambiente und saugt dich sofort in seine Welt. Doch mal langsam, worum geht es um Fallout? Der Anfang ist 
    immer gleich, ihr habt die Apokalypse überlebt und wacht in einer Vault auf. Leider habt ihr weder eine gute Ausrüstung, könnt nicht gut kämpfen 
    und eure Fähigkeiten sind auch noch sehr begrenzt. Nach und nach bekommt ihr bessere Ausrüstung trifft auf andere Menschen und werdet stärker. Ihr kämpft euch durch das Ödland und 
    trifft entscheidungen, die den gesamten Spielverlauf beeinflussen. So war es bisher, jetzt kommt aber der große Unterscheid:
    Die Falloutreihe war Single Player Only, Fallout 76 wird ein PVP Only. Kann das gut gehen? JA! - Warum erfahrt ihr aus dem Video neue Infos.

    <iframe width="516" height="315" src="https://www.youtube.com/embed/kJLs2oWY5p8" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>L]
    [/toggle]
    Wer von euch Zodlern ist dabei? Ich brauch noch einen Packesel ;)

    -Schmerztabletten
    [/COLOR]
    */
  } catch (error) {
    console.error(error);
  }
})();