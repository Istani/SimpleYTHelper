# Phase 4 – Lokale Container-Grundlage

**Stand:** in Arbeit  
**Geltungsbereich:** ausschließlich der Modernisierungsbranch `docker-entwicklung`

## Umgesetzte Grundlage

`compose.yaml` definiert eine lokale PostgreSQL-16-Instanz als private Compose-Ressource:

- kein veröffentlichter Host-Port;
- internes Compose-Netzwerk;
- persistentes benanntes Volume;
- `pg_isready`-Healthcheck;
- kein Passwort, Token oder Discord-Credential in Git.

Zum Start muss `POSTGRES_PASSWORD` außerhalb des Repositories bereitgestellt werden. Die Datei nutzt eine Compose-Interpolation mit Pflichtwert, damit ein unabsichtlicher Start ohne Passwort scheitert.

## Noch nicht Bestandteil dieses Stands

Der Compose-Stack startet bewusst noch keine Community-API, keinen Worker und keinen Discord-Adapter. Diese Container folgen erst, wenn sie einen produktiven Entrypoint, ihren datenbesitzenden Zugriff, Healthchecks und die durch Mia abzusichernde Secret-/Netzwerkkonfiguration besitzen. Ein Test-Memory-Ledger darf nicht als Containerdienst ausgeführt werden.

## Nachweise

Die Compose-Konfiguration wird ohne Secretpersistenz mit einem nur prozesslokal gesetzten Prüfwert validiert:

```sh
POSTGRES_PASSWORD=local-validation-only docker compose -f compose.yaml config --quiet
```

Ein echter Container-Smoke-Test bleibt blockiert, bis auf der Entwicklungsmaschine ein laufender Docker-Daemon erreichbar ist.
