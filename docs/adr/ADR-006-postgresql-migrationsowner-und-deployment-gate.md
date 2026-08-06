# ADR-006: PostgreSQL-Tabelleneigentümerschaft als Gate für SimpleYTH-Migrationen

**Status:** offen – Deployment auf Wunsch angehalten
**Datum:** 2026-08-06

## Kontext

Für die eingehende Discord-Parität enthält der Branch `docker-entwicklung` die
Migration `20260806001500_support_direct_messages`. Sie erlaubt Direct Messages,
ohne künstlichen Guild-Datensatz zu erzeugen, indem sie `guild_id` in
`discord_channel` und `discord_message` nullable macht.

Vor dem vorgesehenen Compose-Rollout auf `defender833` wurde die produktive
PostgreSQL-Migrationslage geprüft. Es wurden ausschließlich Metadaten abgefragt;
keine fachlichen Tabellenzeilen oder Zugangsdaten wurden gelesen bzw. ausgegeben.

## Befund vom 2026-08-06

- Der Laufzeit- und Migrationsprincipal ist `simpleyth_defender`.
- Eigentümer der beiden betroffenen Tabellen ist `postgres`.
- Beide `guild_id`-Spalten sind weiterhin `NOT NULL`.
- `prisma migrate status` erkannte genau eine ausstehende Migration:
  `20260806001500_support_direct_messages`.
- `prisma migrate deploy` brach beim ersten `ALTER TABLE` mit PostgreSQL-Fehler
  `42501` ab: Der Migrationsprincipal muss Eigentümer von `discord_channel` sein.
- Prisma hat deshalb einen unvollständigen, nicht zurückgerollten Eintrag für diese
  Migration in `_prisma_migrations` angelegt. Da der erste DDL-Schritt abgewiesen
  wurde und beide Spalten weiterhin `NOT NULL` sind, liegt kein angewendeter
  fachlicher Schemawechsel vor.

## Entscheidung

Der Compose-Rollout der neuen Web- und Discord-Adapter-Images wird angehalten,
bis eine bewusste Datenbank-Eigentümerschaftsentscheidung vorliegt. Es werden
keine Berechtigungen, Eigentümer, Secrets oder Daten eigenmächtig geändert.

Damit bleiben die derzeit laufenden Compose-Container und der gesamte produktive
PM2-/MariaDB-Bestand, insbesondere `SYTH-Discord`, unverändert. Die bereits
versionierten Änderungen bleiben auf `docker-entwicklung` bereit, sind aber nicht
in die laufenden Container ausgerollt.

## Optionen für die Freigabe

1. **Empfohlen:** Ein PostgreSQL-Administrator überträgt die Eigentümerschaft der
   beiden SimpleYTH-Tabellen an `simpleyth_defender`. Der Migrationsprincipal ist
   damit Eigentümer seiner eigenen Schemaobjekte und kann künftige Prisma-DDL
   kontrolliert ausführen.
2. Ein PostgreSQL-Administrator führt diese Migration einmalig als vorhandener
   Eigentümer `postgres` aus. Der Laufzeitprincipal bleibt eingeschränkt; die
   Migrationsverantwortung wäre danach jedoch dauerhaft getrennt und muss als
   eigener Betriebsprozess dokumentiert werden.
3. Die Direct-Message-Unterstützung wird vorerst zurückgestellt und der
   Deployment-Branch bleibt unverändert nicht ausgerollt.

## Erforderliche Wiederaufnahme nach einer Freigabe

1. Eigentümerschaft bzw. ein einmaliger Migrationsweg wird von Sascha ausdrücklich
   freigegeben und durch einen autorisierten PostgreSQL-Administrator umgesetzt.
2. Den fehlgeschlagenen Prisma-Eintrag erst nach erneuter lesender Schema-Prüfung
   mit `prisma migrate resolve --rolled-back 20260806001500_support_direct_messages`
   bereinigen.
3. `prisma migrate status` prüfen, die Migration anwenden und den Status erneut
   validieren.
4. Compose-Images bauen und kontrolliert starten; Web- und Adapter-Healthchecks
   sowie die vereinbarten Smoke-Tests ausführen.
5. In Docker-stdout verifizieren, dass die SimpleYTH-Anwendungslogs als
   Winston-JSON erscheinen. Erst danach Ben mit der Grafana/Loki-Prüfung der
   tatsächlichen Log-Ingestion beauftragen.

## Folgen

- Der Produktivbestand bleibt sicher und unverändert, statt durch eine
  unberechtigte oder teilweise DB-Migration in einen undefinierten Zustand zu
  geraten.
- Die neue DM-Funktion und die Winston-Logging-Auslieferung bleiben bis zum
  Datenbank-Gate ausstehend.
- Die Datenbank-Eigentümerschaft ist nun als explizite Architektur- und
  Betriebsentscheidung zentral versioniert, nicht nur im Chat dokumentiert.
