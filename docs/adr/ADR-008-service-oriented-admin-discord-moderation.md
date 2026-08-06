# ADR-008: Service-orientierte Adminverwaltung mit Discord-Moderation

- **Status:** Akzeptiert – Umsetzung im Docker-Testbetrieb
- **Datum:** 2026-08-06

## Kontext

Die bisherige Verwaltungsseite mischte Bot-Konfiguration und eine globale Liste
empfangener Discord-Nachrichten. Das ließ weder den Moderationskontext einer
Nachricht erkennen noch eine saubere Erweiterung auf spätere Dienste zu.

Discord ist derzeit der erste integrierte Dienst. Twitch, YouTube oder weitere
Services sollen später eigene Verwaltungsbereiche erhalten, ohne Discord-Modelle
oder Routen wiederzuverwenden.

## Entscheidung

Die Verwaltung verwendet eine Service-Hierarchie:

```text
/admin
└── /admin/discord
    ├── /moderation
    │   ├── /guilds/:guildId
    │   ├── /dms/:channelId
    │   └── /channels/:channelId
    └── /bots
```

### Moderation

- Die Einstiegsseite trennt bekannte Discord-Guilds und DM-/Gruppen-DM-Channels.
- Eine Guild-Detailseite zeigt zwei getrennte Tabellen: Mitglieder mit ihren
  gespeicherten Rollen sowie Channels.
- Ein Channel führt zu einer auf 100 Einträge begrenzten, absteigend sortierten
  Nachrichtenansicht. Medien bleiben reine Icon-/Text-/Link-Zeilen, ohne
  Inline-Vorschau.
- Die Verwaltung ist lesend; sie verändert weder Discord-Rollen noch Channels
  oder Nachrichten.

### Bots

- Die Botübersicht zeigt nur belastbare Registrierungs- und Runtime-Daten:
  Bot-ID, Discord-ID, aktiv/deaktiviert und Adapterstatus.
- Es gibt bewusst **keine** Kennzahl „empfangene Nachrichten je Bot“. Discord-
  Nachrichten werden zentral dedupliziert gespeichert; eine Bot-Empfangsrelation
  wäre eine spätere, separat zu entscheidende Audit-/Routing-Erweiterung.
- Die vorhandenen SimpleYTH-Capabilities `listenMessages`, `allowCommands` und
  `allowReports` erscheinen als Schalter statt als frei editierbares JSON.
- Registrierung, Konfiguration und Tokenrotation erfolgen in getrennten
  Dialogen. Token bleiben write-only und erscheinen niemals in UI oder Responses.

## Konsequenzen

Neue Services erhalten einen parallelen Bereich unter `/admin/<service>`.
Sie brauchen eigene Abfragen und Detailseiten, nicht Discord-spezifische
Relationen. Das hält Administration, Datenownership und spätere API-Grenzen
klar getrennt.

## Testbetriebs-Abnahme

Am 2026-08-06 wurde der Webservice im freigegebenen Docker-Testsystem auf
`defender833` aus dem Commit `279043bd` neu gebaut und ausschließlich mit
`docker compose ... up -d --no-deps web` recreated. Der Discord-Adapter wurde
nicht recreated.

Nachweis:

- Web-Image: `sha256:28e75b3373963a9fb562efe45c213f60952a0f774af60fd38ab1edde19a9f8df`
- Docker-Health: Web und Discord-Adapter jeweils `healthy`
- HTTP-Smoke im Compose-Netz: `GET http://web:80/api/health` →
  `{"status":"ok","service":"simpleyth-web"}`
- Die Webruntime lauscht gemäß Container-Konfiguration auf Port 80; Docker
  veröffentlicht keinen Hostport für den Testservice.
- Legacy-PM2-Prozess `SYTH-Discord`: `online`, PID `1378`; keine Änderung.

## Abgrenzung

Diese Entscheidung führt keine Versandberechtigung, keine Antwortlogik und
keinen ausgehenden Discord-Versand ein.
