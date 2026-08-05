# SimpleYTH – Arbeitsdokumentation

Diese Dokumentation ist die zentrale Arbeitsablage des Docker-/Modernisierungsbranches `docker-entwicklung`.

## Inhalte

- [Planung und Phasenübersicht](PLANUNG.md)
- [Phase 0 – Bestandsaufnahme](phasen/phase-0-bestandsaufnahme.md)
- [Phase 1 – Datenownership-Matrix](phasen/phase-1-datenownership-matrix.md)
- [Phase 1 – Discord-Bot- und Selfbot-Bestand](phasen/phase-1-discord-bot-selfbot-bestand.md)
- [Phase 1 – Kommunikationsgraph](phasen/phase-1-kommunikationsgraph.md)
- [ADR-001 – Transactional Outbox für externe Zustellungen](adr/ADR-001-transactional-outbox-externe-zustellungen.md)
- [ADR-002 – Node.js, Express, Next.js und Prisma](adr/ADR-002-node-express-next-prisma-standard.md)
- [ADR-003 – PostgreSQL-Ziel auf ym-server](adr/ADR-003-ym-server-postgresql-ziel.md)
- [ADR-004 – Interne Authentifizierung des Discord-Adapters](adr/ADR-004-discord-adapter-interne-authentifizierung.md)
- [ADR-005 – Zentrale Discord-Token-Verwaltung](adr/ADR-005-zentrale-discord-token-verwaltung.md)
- [Phase 2 – Interner Discord-Zustellvertrag v1](phasen/phase-2-internal-discord-delivery-contract.md)
- [Phase 3 – Gamecheck-zu-Discord-Migrationsslice](phasen/phase-3-gamecheck-discord-slice.md)
- [Phase 4 – Planreview und priorisierte Umsetzungsgates (2026-08-04)](phasen/phase-4-planreview-2026-08-04.md)
- [Phase 4 – Lokale Container-Grundlage](phasen/phase-4-container-foundation.md)
- [Phase 5 – Discord-Adapter-Runtime](phasen/phase-5-discord-adapter-runtime.md)
- [Phase 5 – Remote-Initialmigration auf ym-server](phasen/phase-5-remote-migration-applied.md)
- [Phase 5 – Discord-Client-Adapter](phasen/phase-5-discord-client-adapter.md)
- [Phase 5 – Multi-Bot-Manager](phasen/phase-5-multi-bot-manager.md)
- [Phase 5 – Datenbank-Kopplung für Multi-Bot-Registrierungen](phasen/phase-5-database-bot-coupling.md)
- [Phase 5 – Zentraler Datenbank-Start für Discord-Bots](phasen/phase-5-zentraler-discord-bot-start.md)
- [Phase 6 – Webfrontend-Container und Rollenbereiche](phasen/phase-6-webfrontend-rollencontainer.md)

## Pflegeprinzip

Jede abgeschlossene Phase erhält hier einen datierten Befund mit Annahmen, echter Ausführungsevidenz, offenen Punkten und Abnahmekriterien. Planungs- oder Architekturentscheidungen werden nicht nur im Chat festgehalten, sondern in diesem Branch versioniert.
