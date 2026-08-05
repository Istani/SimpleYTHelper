# Phase 3 – Erster Migrationsslice: Gamecheck → Discord-Angebotszustellung

**Status:** Implementierungsvorbereitung, noch keine Produktionsänderung  
**Grundlage:** [ADR-001](../adr/ADR-001-transactional-outbox-externe-zustellungen.md), [Discord-Zustellvertrag v1](phase-2-internal-discord-delivery-contract.md)

## 1. Abgegrenzter Legacy-Ablauf

Die lesende Analyse von `gamecheck/app.js` zeigt folgenden Ablauf:

1. `get_games()` startet beim Prozessstart und danach alle 15 Minuten.
2. Es durchsucht `game_link` nach Rabatten über dem fest kodierten Schwellenwert `75`.
3. Ein Kandidat wird nur verarbeitet, wenn mindestens zwei Shop-Links und ein Eintrag in `game_overview` existieren.
4. Die Kombination `game_check(category, game)` dient als Zustandsvergleich:
   - gleicher Rabatt: Eintrag aktualisieren, **keine** Nachricht erzeugen;
   - geänderter Rabatt: alten Eintrag löschen und neuen speichern;
   - neuer Rabatt: neuen Eintrag speichern.
5. Nach einer neuen/geänderten Erkennung sucht `chat_room` nach `linked_game = '$sale'` oder dem Spielnamen und schreibt für jeden Treffer eine Zeile in `outgoing_messages`.
6. Für das Ziel Discord pollt der Legacy-Adapter diese Zeilen aktuell etwa alle 100 ms.

Der erste Slice umfasst **nur** die Discord-Ziele dieser Angebotsbenachrichtigung. Die bestehende Twitter-Erzeugung, andere Plattformen, Import- und Bereinigungslogik bleiben in Produktion unverändert, bis sie jeweils separat migriert und freigegeben wurden.

## 2. Vorläufige Zielverantwortung

| Bereich | Zielowner | Aufgabe im Slice |
|---|---|---|
| Katalog, Rabattvergleich, Benachrichtigungsrouting | `community-api` / Community-Kontext | erkennt relevante Angebotsänderung, ermittelt Discord-Ziele, schreibt Outbox |
| Zustellkoordination | `community-outbox-worker` | claimt Outbox, Retry/Backoff, Adapteraufruf |
| Discord-Transport | `discord-adapter` | nimmt Auftrag idempotent an und sendet über Discord |

Die Zuordnung von `chat_room` zum Community-Kontext ist eine **Arbeitsannahme für diesen Slice**, weil diese Tabelle heute die Zielraumzuordnung für Chatbenachrichtigungen enthält. Sie wird vor der produktiven Migration gegen die vollständige Ownership-Matrix validiert.

## 3. PostgreSQL-Entwurf

Alle folgenden Tabellen liegen im Schema des Community-Owners. Sie sind keine globale Shared-DB-Schnittstelle.

```sql
CREATE TYPE community_outbox_status AS ENUM (
  'pending', 'processing', 'accepted_by_adapter', 'failed'
);

CREATE TABLE community_outbox_event (
  id uuid PRIMARY KEY,
  event_type text NOT NULL,
  schema_version integer NOT NULL CHECK (schema_version > 0),
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  destination text NOT NULL,
  payload jsonb NOT NULL,
  status community_outbox_status NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_owner text,
  lease_expires_at timestamptz,
  last_error_code text,
  last_error_message text,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (status = 'processing') = (lease_owner IS NOT NULL AND lease_expires_at IS NOT NULL)
  )
);

CREATE INDEX outbox_event_ready_idx
  ON community_outbox_event (destination, next_attempt_at, created_at)
  WHERE status = 'pending';
```

Der Community-Write speichert den Rabattzustand und die zugehörigen `community.message.delivery-requested.v1`-Events **in einer einzigen Transaktion**. Für mehrere Discord-Räume entstehen mehrere Events mit jeweils eigener UUID.

Beispiel für sicheres Claiming durch mehrere Worker-Instanzen:

```sql
WITH candidate AS (
  SELECT id
  FROM community_outbox_event
  WHERE destination = 'discord'
    AND status = 'pending'
    AND next_attempt_at <= now()
  ORDER BY created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
UPDATE community_outbox_event event
SET status = 'processing',
    lease_owner = $1,
    lease_expires_at = now() + interval '5 minutes',
    attempt_count = event.attempt_count + 1,
    updated_at = now()
FROM candidate
WHERE event.id = candidate.id
RETURNING event.*;
```

Der Discord-Adapter besitzt sein eigenes Ledger. Seine konkrete Datenbank wird nicht vom Community-Kontext direkt gelesen oder beschrieben:

```sql
CREATE TABLE discord_adapter_delivery (
  event_id uuid PRIMARY KEY,
  payload_hash text NOT NULL,
  status text NOT NULL CHECK (status IN ('accepted', 'sent', 'failed')),
  discord_message_id text,
  failure_reason text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

## 4. Ablauf nach Migration des Slices

```text
Angebotsänderung erkannt
  → Community-Transaktion: Rabattzustand + Discord-Outbox-Event(s)
  → Outbox-Worker claimt ein Event
  → POST /internal/v1/deliveries mit Event-ID als Idempotency-Key
  → Discord-Adapter persistiert Ledger und antwortet 202
  → Worker markiert Event accepted_by_adapter
  → Adapter sendet über discord.js und führt sein Ledger weiter
```

Ein Adapter-Timeout bleibt absichtlich wiederholbar: Derselbe Key führt beim Adapter nicht zu einer zweiten Nachricht.

## 5. Implementierungsbacklog und Abnahme

| Reihenfolge | Arbeit | Abnahmebeweis |
|---:|---|---|
| 1 | Community-Datenmodell, Outbox-Migration und Transaktionsgrenze implementieren | Migration auf leerer PostgreSQL-Test-DB; Test beweist Rollback von Fachzustand **und** Outbox bei Fehler |
| 2 | Outbox-Claiming, Lease-Recovery und Backoff implementieren | Paralleltest mit mindestens zwei Workern; nur einer erhält dieselbe Event-ID |
| 3 | Discord-Adapter: interne Route, Auth-Middleware und persistentes Ledger implementieren | Contract-Test: identischer Key/identische Payload ist idempotent; abweichende Payload liefert `409` |
| 4 | Discord-Versand hinter Ledger implementieren | Fake-Discord-Client beweist: retryte Adapterannahme erzeugt nur einen Send-Aufruf |
| 5 | Worker-zu-Adapter-Client implementieren | `202`, Timeout, `429`, `503`, `400`, `401`, `409` werden gemäß Phase-2-Vertrag getestet |
| 6 | Lokales Compose-Testsystem mit PostgreSQL, Community, Worker und Discord-Fake bereitstellen | `docker compose up` + Healthchecks + automatisierter End-to-End-Smoke-Test |
| 7 | Staging-Cutover- und Rollback-Runbook erstellen | Paralleler Vergleich mit Legacy-Flow ohne produktives Umschalten; Rückfall ohne Datenlöschung beschrieben |

## 6. Nicht im Slice enthalten

- Produktive MariaDB- oder PM2-Änderungen.
- Abschaltung von `gamecheck`, `discord/app.js`, `outgoing_messages` oder `send_tweet`.
- Twitter, Twitch, YouTube oder ein allgemeiner Broker.
- Öffentliche HTTP-Endpunkte oder die Wiederverwendung bestehender Browser-Socket.IO-Verbindungen.
- Finales Secrets-/mTLS-/Token-Rotationsdesign; dafür wird Mia vor Implementierung eingebunden.

## 7. Festgelegte technische Basis

Der erste Community-Kontext wird gemäß [ADR-002](../adr/ADR-002-node-express-next-prisma-standard.md) als modernes Node.js-/JavaScript-Projekt umgesetzt: Express.js für die interne API, Prisma für PostgreSQL-Zugriff und Migrationen. TypeScript und Next.js sind für diesen Worker-/Adapter-Slice nicht erforderlich; Next.js bleibt der Standard, sobald ein Website-Slice umgesetzt wird.
