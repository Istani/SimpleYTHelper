# SimpleYTH – Phase 1: Discord-Bot- und Selfbot-Bestand

**Stand:** 2026-07-30  
**Methode:** ausschliesslich lesende Untersuchung auf `defender833`: PM2-Prozessinventar, Projektverzeichnis-/Dateinamen und `package.json`-Abhängigkeiten unter `/root` und `/home` (begrenzte Rekursion); keine Prozesse, Konfigurationen oder Tokens verändert oder ausgegeben.

## Befund

| Gegenstand | Befund | Evidenz |
|---|---|---|
| Normaler Discord-Bot | **vorhanden und aktiv** | PM2 `SYTH-Discord` → `/root/SimpleYTHelper/discord/app.js`; Modulabhängigkeit `discord.js` |
| Discord-Web-Login | **vorhanden** | `/root/SimpleYTHelper/website/package.json` enthält `passport-discord` |
| Separater Discord-Selfbot / Userbot | **nicht nachgewiesen** | Kein passender PM2-Prozess, keine passenden Dateinamen, keine Selfbot-/Userbot-Paketabhängigkeit im untersuchten Bereich |
| Weitere PM2-Dienste | **kein Selfbot-Kandidat** | Alle 18 auswertbaren PM2-Prozesse zeigen auf bekannte SimpleYTH-Module bzw. `pm2-logrotate` |

## Einordnung

Der aktuelle Produktbestand enthält einen normalen Discord-Bot-Adapter und Web-OAuth über Discord. Für einen Discord-Selfbot gibt es im überprüften produktiven Projektbestand und den aktiven PM2-Prozessen keine belastbare Evidenz.

Dies ist ein **negativer Befund innerhalb des untersuchten Hosts und Scope**, keine globale Aussage über möglicherweise externe Hosts, nicht durch PM2 verwaltete User-Services oder manuell gestartete Prozesse ausserhalb der geprüften Pfade.

## Architekturfolge

1. Es wird derzeit **kein** Selfbot als migrierbarer Service in das Compose-Zielbild aufgenommen.
2. `SYTH-Discord` bleibt fachlich ein Bot-Adapter; sein direkter Zugriff auf Chat-, Kanal-, Token- und Outbox-Tabellen wird im Zielbild durch versionierte APIs ersetzt.
3. Falls später ein Selfbot nachgewiesen wird, erhält er einen **eigenen** Service, eine eigene Discord-Identität und eigene Secret-Zuordnung. Er darf weder Prozess noch Token noch direkte Datenbankzugriffe mit dem Bot teilen.
4. Vor einer späteren Wiedereinführung oder Migration eines Selfbots ist eine separate ADR mit Betriebskonzept, Datenbedarf, Berechtigungen und Discord-Compliance erforderlich.

## Offene Restprüfung

- Bei einem Hinweis auf einen anderen Host, Systemd-User-Service oder Container muss die Suche dort separat wiederholt werden.
- Die Bot-HTTP-/Event-Grenzen und sein künftiger Zugriff auf `community-api` und `identity-api` werden im nächsten API- und Service-Schnitt dokumentiert.
