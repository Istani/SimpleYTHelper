# ADR-001: Transactional Outbox für externe Zustellungen im ersten Modernisierungsslice

**Status:** angenommen  
**Datum:** 2026-07-30

## Kontext

Heute schreiben `gamecheck`, `rpg`, `chatcommands` und `pkmn` direkt in die gemeinsame MariaDB-Tabelle `outgoing_messages`; `gamecheck` schreibt zusätzlich nach `send_tweet`. Discord, Twitch und YouTube pollen ihre Zustellaufträge ungefähr alle 100 ms und löschen die Zeile nach dem Versand. Twitter pollt per Cron.

Dies ist eine implizite, nicht versionierte Event-Kommunikation mit Shared-DB-Kopplung. Es existieren keine ausdrücklichen Claims, Zustellstatus, Retry-Regeln oder klaren Zustellverträge.

Die bestehenden Socket.IO- und Webports sind Browser-/UI-Schnittstellen und werden nicht als interne Service-APIs wiederverwendet.

## Entscheidung

Der erste Modernisierungsslice verwendet eine **Transactional Outbox in PostgreSQL ohne zusätzlichen Message-Broker**.

Die Zustellkomponenten werden wie folgt getrennt:

```text
community-api
  owns: Community-Daten und Outbox-Einträge
  writes: fachliche Änderung + Outbox-Event atomar

community-outbox-worker
  belongs to: Community-Kontext, kein allgemeiner DB-Service
  reads: ausschließlich die Community-Outbox
  does: Claim, Retry, Zustellstatus und Aufruf des Zieladapters

discord-adapter
  owns: Discord-Verbindung, discord.js-Laufzeit und Discord-Secret
  accepts: dokumentierten internen Zustellauftrag
  does not own: Community-PostgreSQL oder deren Tabellen
```

Der Worker ist ein normaler Background-Worker. Er ist **kein Datenbankservice**, keine neue Shared-DB-Schnittstelle und kein Owner fremder Daten. Seine direkte PostgreSQL-Verbindung beschränkt sich auf die Outbox seines eigenen fachlichen Kontexts.

## Ablauf

1. `community-api` führt eine fachliche Änderung aus.
2. In **derselben PostgreSQL-Transaktion** speichert es einen Outbox-Eintrag, etwa `community.message.delivery-requested.v1`.
3. `community-outbox-worker` claimt einen offenen Eintrag atomar und mit zeitlich begrenzter Lease.
4. Der Worker ruft die versionierte interne Zustell-API des passenden Adapters auf, z. B. Discord.
5. Bei bestätigter Annahme wird der Eintrag als `delivered` markiert; bei Fehlern wird er mit Backoff erneut versucht.
6. Nach der maximalen Versuchszahl erhält der Eintrag `failed`; er bleibt für Diagnose und kontrolliertes Replay erhalten.

## Mindestzustand eines Outbox-Eintrags

| Feld | Zweck |
|---|---|
| `id` (UUID) | stabile Event- und Idempotenz-ID |
| `event_type` | versionierter fachlicher Typ |
| `schema_version` | Payload-Vertragsversion |
| `aggregate_type`, `aggregate_id` | fachlicher Ursprung |
| `destination` | Zieladapter, z. B. `discord` |
| `payload` (JSONB) | für Zustellung benötigte, minimale Daten |
| `status` | `pending`, `processing`, `delivered`, `failed` |
| `attempt_count`, `next_attempt_at` | Retry und Backoff |
| `lease_owner`, `lease_expires_at` | exklusive Verarbeitung und Crash-Recovery |
| `created_at`, `delivered_at` | Nachvollziehbarkeit |

## Inbound-Vertrag des Discord-Adapters

Der Discord-Adapter erhält einen neuen, versionierten **internen** Zustellvertrag. Er ist nicht öffentlich und nicht mit bestehenden Webseiten- oder Socket.IO-Routen identisch.

Die genaue Transportform, Authentisierung und das OpenAPI-Artefakt werden erst im Implementierungsslice spezifiziert. Der Adapter muss die Event-ID als Idempotenzschlüssel behandeln, damit ein Retry keine Doppelzustellung erzeugt.

## Folgen

### Positiv

- Keine neuen direkten DB-Zugriffe der Adapter auf Community-Daten.
- Zustellung ist nachvollziehbar, wiederholbar und gegen parallele Worker abgesichert.
- Kein zusätzlicher Broker im ersten Slice; geringerer Betriebsaufwand.
- Discord-Bot und später möglicher Selfbot bleiben getrennte Adapter mit getrennten Secrets.

### Negativ / bewusst akzeptiert

- Der Worker und der Adapter sind für die Zustellung zunächst synchron gekoppelt; die Outbox absorbiert Ausfälle durch Retry.
- Für viele Hochvolumen- oder Fan-out-Events kann später ein Broker sinnvoll werden.
- „Exactly once“ ist mit externen APIs nicht garantierbar; stattdessen wird mindestens einmal zugestellt und der Adapter arbeitet idempotent.

## Nicht entschieden

- Welche Community-Operation zuerst migriert wird.
- Vollständiges Authentisierungsmodell für interne Adapteraufrufe.
- Broker-Auswahl, falls sie später erforderlich wird.
- Detaillierte PostgreSQL-Migrations- und Cutover-Reihenfolge.
