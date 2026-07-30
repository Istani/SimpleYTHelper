# Phase 2 – Interner Discord-Zustellvertrag v1

**Status:** Entwurf zur Implementierungsvorbereitung  
**Vertrag:** [`contracts/openapi/internal-discord-delivery-v1.openapi.json`](../../contracts/openapi/internal-discord-delivery-v1.openapi.json)  
**Architekturentscheidung:** [ADR-001](../adr/ADR-001-transactional-outbox-externe-zustellungen.md)

## Zweck

Dieser Vertrag ersetzt für den ersten Slice keinen Browser-Socket und keine bestehende Webroute. Er definiert ausschließlich, wie `community-outbox-worker` einem `discord-adapter` einen externen Zustellauftrag übergibt.

## Semantik

1. Der `community-api`-Owner schreibt die fachliche Änderung und das Outbox-Event in derselben PostgreSQL-Transaktion.
2. Der Worker claimt das Event und sendet es mit `POST /internal/v1/deliveries` an den Discord-Adapter.
3. Die UUID wird gleichzeitig als `event_id` und `Idempotency-Key` übergeben.
4. Der Adapter persistiert den Auftrag in einer **eigenen Zustell-Ledger** und antwortet `202 accepted`.
5. Der Worker markiert seine Outbox-Zustellung erst dann als `accepted_by_adapter`; bei Timeout, `429` oder `503` erfolgt Backoff-Retry.
6. `accepted` ist absichtlich nicht gleich „die Nachricht ist sichtbar in Discord“. Die tatsächliche externe Zustellung wird im Adapter-Ledger verfolgt. Das verhindert die falsche Behauptung einer genau-einmal-Zustellung gegenüber einer externen API.

## Kompatibilität mit Legacy-Feldern

| Legacy `outgoing_messages` | v1-Vertrag | Bemerkung |
|---|---|---|
| `service = discord` | Zieladapter wird durch Aufruf des Discord-Endpunkts bestimmt | kein frei editierbares Zielservice-Feld im v1-Payload |
| `server` | `target.guild_id` | optional, wenn für Routing/Diagnose vorhanden |
| `room` | `target.channel_id` | Discord-Zielkanal |
| `content` | `content` | v1 begrenzt auf Discords 2.000 Zeichen |
| fehlende ID | `event_id` / `Idempotency-Key` | neue UUID, persistent und eindeutig |
| nach Versand gelöscht | Status + Zustellversuche | keine Löschung vor nachvollziehbarer Terminalentscheidung |

## Fehler- und Retry-Regeln

| Antwort / Ereignis | Aktion des Workers |
|---|---|
| `202` | `accepted_by_adapter`, kein erneuter Versand desselben Events |
| Netzwerkfehler / Timeout | Retry; derselbe Idempotency-Key |
| `429`, `503` | Retry mit exponentiellem Backoff und Jitter |
| `400` | `failed_permanent`, Payload-/Erzeugerfehler dokumentieren |
| `401` | `failed_security`, Alarm und keine Endloswiederholung |
| `409` | `failed_contract_conflict`, manuelle Diagnose |

Vorgeschlagener Backoff: 30 Sekunden, 2 Minuten, 10 Minuten, 30 Minuten, danach `failed` nach maximal fünf Versuchen. Die konkreten Zeiten werden bei der Implementierung als Konfiguration festgelegt, nicht im Code fest verdrahtet.

## Abnahmekriterien für die spätere Implementierung

- Der OpenAPI-Vertrag wird in CI syntaktisch validiert.
- Der Adapter weist Requests ohne interne Authentisierung ab.
- Derselbe `Idempotency-Key` mit identischer Payload erzeugt keine Doppelzustellung und liefert erneut den bestehenden Annahmestatus.
- Derselbe Schlüssel mit abweichender Payload erzeugt `409`.
- Ein `503` führt im Worker zu Retry mit unveränderter Event-ID.
- Ein akzeptierter Auftrag bleibt nach Adapter-Neustart im Ledger auffindbar.
- Kein Discord-Token, keine PostgreSQL-Credentials und keine Legacy-DB-Verbindung erscheinen im Contract, Testfixture oder Log.

## Noch offene Implementierungsentscheidungen

- Interne Authentisierung und Token-Rotation (Mia verantwortet Secrets-/Transporthärtung).
- Persistenztechnik und Retention des Adapter-Ledgers.
- Wie der Adapter die finale externe Delivery nach Discord bestätigt bzw. als nicht zustellbar markiert.
- Auswahl des ersten tatsächlichen Erzeugerflows: Empfehlung `gamecheck` → Discord-Angebotsnachricht, weil er heute sowohl Outbox als auch Tweet-Auftrag erzeugt.
