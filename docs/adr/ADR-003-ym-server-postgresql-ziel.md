# ADR-003: Gemeinsamer PostgreSQL-Container auf `ym-server` als SimpleYTH-Ziel

**Status:** angenommen
**Datum:** 2026-08-05

## Kontext

Für die Modernisierung braucht SimpleYTH ein dauerhaft verfügbares PostgreSQL-Ziel,
ohne den produktiven PM2-/MariaDB-Bestand auf `defender833` zu berühren. Sascha hat
den PostgreSQL-Container mit der Container-IP `10.10.14.253` auf `ym-server` als
Ziel festgelegt.

Die lesende Bestandsprüfung am 2026-08-05 ergab:

- Host: `ym-server` (`10.10.14.1`), Containername `postgres`;
- Image: `postgres`, seit zwei Monaten laufend;
- Restart-Policy: `unless-stopped`;
- Netzwerk: `wireguard_net` (`10.10.14.0/24`), Container-IP `10.10.14.253`;
- keine Veröffentlichung von Port 5432 auf dem Host;
- Datenbanken `postgres` und `sknet`, jeweils nur mit Schema `public` und ohne
  benutzerdefinierte Relationen.

Damit enthält der Container zum Prüfzeitpunkt **keine SimpleYTH-Tabellen und keine
fachlichen SimpleYTH-Daten**. Die Aussage beruht auf einer lesenden Abfrage der
Nutzerrelationen und nicht auf einer Prüfung oder Ausgabe von Payloads.

## Entscheidung

1. Neue SimpleYTH-Services verwenden den PostgreSQL-Container auf `ym-server` als
   Laufzeit-Ziel. Der Container bleibt mit seiner vorhandenen Restart-Policy
   dauerhaft verfügbar; SimpleYTH startet, stoppt oder ersetzt ihn nicht.
2. SimpleYTH erhält vor der ersten Anwendungsmigration eine **eigene** Datenbank und
   einen least-privilege Runtime-Principal. `postgres` und `sknet` werden nicht
   stillschweigend als SimpleYTH-Datenbank wiederverwendet.
3. Datenbankname, Principal, Netzwerkzugriff und Secret-Injektion werden im
   Security-Gate mit Mia eingerichtet. Die Zugangsdaten werden weder in Git noch
   in Compose-Dateien, Images oder Logs gespeichert.
4. `compose.yaml` bleibt im Projekt als reproduzierbarer **lokaler, expliziter
   Smoke-Test-Fallback**. Der darin enthaltene PostgreSQL-Service läuft nur im
   Profil `local-smoke`; er ist nicht das festgelegte Laufzeit-Ziel.
5. Die künftigen SimpleYTH-Anwendungsservices referenzieren die Remote-Datenbank
   ausschließlich über eine zur Laufzeit injizierte `DATABASE_URL`. Sie treten dem
   vorhandenen `wireguard_net` nur beim Deployment auf `ym-server` bei; externe
   Services erhalten keinen neuen direkten Datenbankzugriff.

## Folgen

### Positiv

- Ein dauerhaft verfügbares PostgreSQL-Ziel ist vorhanden, ohne den MariaDB-Cutover
  vorwegzunehmen.
- Der lokale Smoke-Test bleibt für migrationssichere, wegwerfbare Validierung
  verfügbar und produziert keine Remote-Testdaten.
- Der bestehende PostgreSQL-Container bleibt privat im Docker-Netz; Port 5432 wird
  nicht zusätzlich veröffentlicht.

### Bewusst offen

- Anlegen der separaten SimpleYTH-Datenbank und des Runtime-Principals nach dem
  Security-Gate.
- Sichere Secret-Injektion, Rotation und die konkrete Netzwerkmitgliedschaft neuer
  Container (mit Mia).
- Der produktive MariaDB-zu-PostgreSQL-Cutover, Datenübernahme und Rollback.
