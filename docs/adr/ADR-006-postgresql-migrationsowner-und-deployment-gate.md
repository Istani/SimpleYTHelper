# ADR-006: Einheitlicher PostgreSQL-Principal für den SimpleYTH-Testbetrieb

**Status:** angenommen – Container-Rollout bewusst ausstehend
**Datum:** 2026-08-06

## Kontext

Für die eingehende Discord-Parität enthält der Branch `docker-entwicklung` die
Migration `20260806001500_support_direct_messages`. Sie erlaubt Direct Messages,
ohne künstlichen Guild-Datensatz zu erzeugen, indem sie `guild_id` in
`discord_channel` und `discord_message` nullable macht.

Der SimpleYTH-Betrieb befindet sich laut Saschas Vorgabe weiterhin im Test.
Dafür soll bei Tabellenanlage, Prisma-Migrationen und Anwendungslaufzeit stets
dieselbe vorhandene PostgreSQL-Identität verwendet werden.

## Befund und Ausführung vom 2026-08-06

- Die betroffenen Tabellen gehören dem PostgreSQL-Principal `postgres`.
- Der zuvor in `DATABASE_URL` verwendete Principal `simpleyth_defender` konnte
  deshalb keine DDL-Änderung ausführen. Prisma brach beim ersten `ALTER TABLE`
  mit PostgreSQL-Fehler `42501` ab und registrierte einen unvollständigen
  Migrationseintrag.
- Es wurden dabei keine fachlichen Tabellenzeilen gelesen oder ausgegeben. Die
  Spalten waren nach der Ablehnung weiterhin `NOT NULL`.
- Der `POSTGRES_PASSWORD`-Secretwert ist bereits ausschließlich im PostgreSQL-
  Container auf `ym-server` hinterlegt. Er wurde ohne Ausgabe, Git-Übernahme
  oder Log-Ausgabe in die hostlokale `/opt/simpleyth/.env` auf `defender833`
  für die bestehende `postgres`-Verbindung übernommen.
- Die Verbindung wurde aus dem Compose-relevanten Docker-Netz geprüft; der
  angemeldete Principal war `postgres`.
- Der fehlgeschlagene Prisma-Eintrag wurde mit
  `prisma migrate resolve --rolled-back 20260806001500_support_direct_messages`
  sauber zurückgesetzt.
- `prisma migrate deploy` wendete die Migration erfolgreich an; ein anschließendes
  `prisma migrate status` bestätigte: **Database schema is up to date**.

## Entscheidung

Im SimpleYTH-Testbetrieb verwenden die Anwendungen und Prisma-Migrationen den
vorhandenen PostgreSQL-Principal `postgres` über die hostlokale Secret-Injektion
auf `defender833`. Die Zugangsdaten bleiben außerhalb von Git, Images und Logs.

Das ist eine bewusste **Testbetriebsentscheidung**. Vor einem späteren
Produktiv-Cutover wird die Datenbank-Principal- und Berechtigungsgrenze erneut
als separates Security-Gate bewertet; diese ADR legitimiert keine Übernahme von
Superuser-Zugangsdaten in einen Produktivbetrieb.

## Container- und Build-Status

- Das Web-Image wurde als `35918247e713` erfolgreich gebaut. Der Next.js-
  Produktionsbuild inklusive der Winston-Instrumentation war erfolgreich.
- Die Web- und Adapter-Compose-Container wurden im freigegebenen Testbetrieb
  kontrolliert ersetzt; beide meldeten anschließend `healthy`.
- Web-Healthcheck: `{"status":"ok","service":"simpleyth-web"}`.
- Adapter-Healthcheck: `{"status":"ok"}`.
- Docker-stdout enthält strukturierte Winston-JSON-Ereignisse, unter anderem
  `web_runtime_started`, `healthcheck_served` und `adapter_listening`.
- Die vorherige Discord.js-Deprecation (`ready`) wurde testgetrieben korrigiert:
  Adapter-Commit `e7a0d949` nutzt nun `clientReady`. Das frisch gestartete
  Adapter-Log enthält die Warnung nicht mehr; das aktuelle Image lautet
  `1e8e6e2b0d2b`.
- Der PM2-Bestand, insbesondere `SYTH-Discord`, blieb unverändert online.

## Observability-Abnahme

Die Grafana/Loki-Ingestion wurde ausschließlich lesend über `defender833` gegen
den in Alloy konfigurierten Zielpfad geprüft:

```text
http://10.10.14.251:3100/loki/api/v1/push
```

- Alloy läuft auf `defender833`; beide SimpleYTH-Container verwenden den
  Docker-Logdriver `json-file`.
- Die Loki-Query-API lieferte HTTP 200. Ein einmaliges `/ready` mit HTTP 503 war
  bei Wiederholung unmittelbar `HTTP 200` mit `ready`; ein aktueller Loki-Ausfall
  ist daher nicht belegt.
- Im Zeitfenster `2026-08-06T09:29:50Z` bis `09:31:10Z` lieferte die Abfrage
  `{service_name="defender833-simpleyth-modernization-web-1"}` einen Stream mit
  acht gültigen JSON-Einträgen (`simpleyth-web`).
- Die Abfrage
  `{service_name="defender833-simpleyth-modernization-discord-adapter-1"}`
  lieferte einen Stream mit zwei gültigen JSON-Einträgen
  (`simpleyth-discord-adapter`).
- Im erweiterten Fenster von 09:23 bis 09:31 UTC enthielt Web 46 valide
  Winston-JSON-Einträge und der Adapter drei. Die erwarteten Felder `level`,
  `message`, `service` und `timestamp` sind im Logkörper vorhanden.

Für Loki-Abfragen ist `service_name` das Docker-Containerlabel. Der Winston-
Wert `service` bleibt ein Feld im JSON-Logkörper und ist nicht das passende
Loki-Streamlabel.

## Folgen

- Der DDL-Blocker ist im Testbetrieb behoben und die DM-Schemaunterstützung ist
  in PostgreSQL vorhanden.
- Der getestete Laufzeit- und Migrationsweg verwendet durchgehend dieselbe
  PostgreSQL-Identität.
- Ein Anwendungsausfall oder unbeabsichtigter Containerwechsel wurde vermieden:
  der Build ist validiert, der Rollout bleibt eine eigene, explizite Freigabe.
