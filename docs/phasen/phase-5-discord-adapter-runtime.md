# Phase 5 – Discord-Adapter: interne Authentifizierung und Runtime-Grundlage

**Stand:** implementiert und lokal geprüft
**Datum:** 2026-08-05

## Ziel dieses Slices

Der bisherige Express-Routenprototyp wird zu einer startbaren Discord-Adapter-
Runtime ausgebaut. Der Slice beendet bewusst noch keinen Discord-Versand und nimmt
keine Datenbankmigration auf `ym-server` vor.

## Umgesetzte Grundlage

- `/healthz` antwortet ohne interne Authentisierung mit `200 {"status":"ok"}`.
- `POST /internal/v1/deliveries` verlangt ein Bearer-Token, bevor ein
  Ledger-Zugriff stattfinden kann.
- Fehlende, falsch formatierte und abweichende Tokens liefern `401`; der Vergleich
  erfolgt bei gleicher Länge timing-sicher.
- Ein fehlendes `INTERNAL_ADAPTER_TOKEN` lässt die Runtime fehlschlagen, bevor ein
  Prisma-Client gebaut wird.
- `src/discord-adapter/runtime.js` verdrahtet Authentisierung, Prisma-Client und
  Delivery-Ledger.
- `npm run start:discord-adapter` startet den Adapter. Der Prisma-Client verwendet
  zur Laufzeit ausschließlich `DATABASE_URL` und die PostgreSQL-Adapterbibliothek.
- `SIGINT` und `SIGTERM` schließen HTTP-Listener und Prisma-Verbindung geordnet.

Die Authentisierungsentscheidung ist in
[ADR-004](../adr/ADR-004-discord-adapter-interne-authentifizierung.md) dokumentiert.

## Ausführungsevidenz

Am 2026-08-05 erfolgreich ausgeführt:

```text
npm test                 # 14/14 Tests erfolgreich
npm run test:contract    # OpenAPI contract structure is valid
npm run prisma:validate  # Prisma-Schema gültig
```

Zusätzlich wurde die echte Runtime mit einem ausschließlich temporären Testtoken
und einer absichtlich nicht erreichbaren lokalen Datenbank-URL gestartet. Ohne
Datenbankzugriff verifiziert:

```text
GET  /healthz                        -> 200 {"status":"ok"}
POST /internal/v1/deliveries ohne Token -> 401
```

Der Testprozess wurde danach beendet. Es wurde weder eine Migration noch eine
Verbindung zur Produktivdatenbank auf `ym-server` ausgeführt.

## Offene Abnahmegates

1. **Mia:** Runtime-Secret-Injektion, Token-Rotation und finale interne
   Docker-/VPN-Netzgrenze abstimmen; kein Token in Compose oder Image ablegen.
2. **Abhängigkeiten:** Die transitive `fast-uri`-Schwachstelle wurde mit
   `npm audit fix` auf `fast-uri@3.1.5` aktualisiert. Die erneute
   Produktionsprüfung (`npm audit --omit=dev --audit-level=high`) meldet
   keine Vulnerabilities.
3. **Datenbank:** Erst nach expliziter Nutzerfreigabe die Initialmigration in
   `postgres.public` auf `ym-server` anwenden und einen echten Ledger-Smoke-Test
   ausführen.
4. **Discord-Transport:** Erst anschließend `discord.js`, Bot-Secret und den
   idempotenten Send-Worker ergänzen. Der Bot-Service bleibt vom Selfbot-Service
   getrennt.
