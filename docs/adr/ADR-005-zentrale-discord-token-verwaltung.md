# ADR-005 – Zentrale Klartext-Verwaltung der Discord-Bot-Tokens in PostgreSQL

**Status:** angenommen
**Datum:** 2026-08-05

## Kontext

Der Multi-Bot-Service soll ohne Token-Sprawl über mehrere Docker-Dateien und
Container-Konfigurationen betrieben werden. Der Betreiber möchte Bots, deren
Token, Aktivstatus und Capabilities zentral in `postgres.public` verwalten.

Ein Hash genügt dafür nicht: Ein Discord-Client muss den ursprünglichen Token
bei `client.login(token)` verwenden können.

## Entscheidung

1. `discord_bot_registration.token` enthält den Discord-Bot-Token im Klartext.
2. Nur der Discord-Adapter liest aktive Registrierungen (`is_active = true`) aus
   dieser Tabelle, startet dafür einen Client und schreibt die nach Login bekannte
   `discord_user_id` zurück.
3. Die Einstellungen liegen pro Bot als JSONB in `settings`; derzeit sind
   `allowCommands`, `allowReports` und `listenMessages` vorgesehen. `listenMessages`
   bzw. `allowCommands` aktiviert nur die hierfür erforderlichen Discord Gateway
   Intents.
4. Weder HTTP-Antworten, Anwendungslogs noch die Git-Historie dürfen das Feld
   `token` ausgeben. Die öffentliche/interne API liefert Registrierungsmetadaten
   ohne Tokenwert.
5. Der Datenbankzugang bleibt auf das private VPN beschränkt. Direkte
   PostgreSQL-Zugriffsrechte bleiben auf Betreiber und den Adapter beschränkt.

## Folgen

- Neue Bots können zentral per DB-Row hinzugefügt, mit `is_active` aktiviert
  beziehungsweise gestoppt und mit ihren Capabilities konfiguriert werden.
- Die Adapter-Runtime lädt beim Start alle aktiven Rows und startet diese Clients;
  die User-ID wird persistent zurückgeschrieben.
- Ein Zugriff auf die Datenbank ist nun gleichbedeutend mit Zugriff auf Discord-
  Bot-Credentials. Das akzeptiert der Betreiber für den aktuellen VPN-Betrieb.
- Eine spätere Migration auf verschlüsselte Token oder einen Vault bleibt möglich,
  ohne das Multi-Bot-API-Modell zu verändern.
