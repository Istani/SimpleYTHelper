# ADR-002: JavaScript-, Express-, Next.js- und Prisma-Standard für neue SimpleYTH-Komponenten

**Status:** angenommen  
**Datum:** 2026-07-30

## Kontext

Der Bestand ist Node.js mit JavaScript, Express-artigen Webdiensten sowie Knex/Objection und MariaDB. Der erste Modernisierungsslice benötigt einen neuen Community-Kontext mit PostgreSQL-Outbox, einem Worker und einem internen Discord-Vertrag.

Sascha hat für neue SimpleYTH-Komponenten Node.js als Standard festgelegt. TypeScript soll vermieden werden, sofern es nicht später durch einen konkreten, belegten Bedarf gerechtfertigt wird. Für Server ist Express.js vorgesehen, für Websites Next.js.

Die lokale Entwicklungsumgebung verfügt nach realer Prüfung über Node.js `v22.22.3`, npm `10.9.8` und ausführbares Prisma CLI `7.9.1`.

## Entscheidung

| Baustein | Festlegung |
|---|---|
| Laufzeit | Node.js 22 LTS oder kompatibler, im Container explizit gepinnt |
| Anwendungssprache | modernes JavaScript mit ESM; kein TypeScript im ersten Slice |
| HTTP-Server | Express.js |
| Weboberfläche | Next.js, nur falls ein Slice tatsächlich eine Website benötigt |
| Datenzugriff und Schema-Migration | Prisma mit PostgreSQL |
| Validierung an Systemgrenzen | JSON Schema/OpenAPI-Contract-Tests und Laufzeitvalidierung statt TypeScript-Kompilierung |

Prisma ersetzt im **neuen** Community-Kontext Knex und Objection. Es wird nicht in den produktiven Legacy-Bestand eingebaut und es erzeugt keine neue Shared-DB-Kopplung.

## Begründung

- Node.js und JavaScript minimieren den Bruch zum vorhandenen Betrieb und entsprechen der Produktentscheidung.
- Express ist für die kleine interne Adapter-API bewusst schlank und etabliert.
- Prisma liefert ein konsistentes PostgreSQL-Schema- und Migrationsmodell; das ist für Outbox, Indizes, Constraints und einen späteren MariaDB-zu-PostgreSQL-Cutover wertvoller als das bestehende verstreute Knex-/Objection-Muster.
- OpenAPI-Vertrag, JSON-Schema und Contract-Tests sichern die wichtigen Grenzen zur Laufzeit, ohne TypeScript einzuführen.
- Next.js wird nicht als Backend-Ersatz missbraucht: Browser-Webseiten bleiben getrennt von Express-Service-APIs und Background-Workern.

## Regeln für Prisma im ersten Slice

1. Prisma-Migrationen werden nur gegen eine lokale/Container-PostgreSQL-Instanz entwickelt und getestet.
2. SQL, das Prisma nicht sinnvoll ausdrücken kann (z. B. `FOR UPDATE SKIP LOCKED`, Enum-Details oder Teilindizes), liegt als bewusst geprüfte SQL-Migration im Prisma-Migrationsverzeichnis vor.
3. Der Worker verwendet für atomisches Claiming eine transaktionale, parametrisierte SQL-Abfrage; keine handgebaute String-SQL-Konkatenation.
4. Prisma-Modelle und die OpenAPI-Payload bleiben getrennte Verträge: Datenbankmodell ist nicht automatisch HTTP-Payload.
5. Secrets bleiben ausschließlich in Laufzeit-Konfiguration; weder `DATABASE_URL` noch Discord-Token gelangen in Git, Docker-Image oder Testausgaben.

## Folgen

### Positiv

- Einheitliche Grundlage für neue Services und spätere Website-Slices.
- Reproduzierbare PostgreSQL-Migrationen und ein klarer Rückweg in der lokalen Entwicklungsumgebung.
- Keine TypeScript-Toolchain im ersten Slice.

### Negativ / bewusst akzeptiert

- JavaScript verschiebt einige Fehler von der Kompilierung in Tests und Laufzeitvalidierung.
- Prisma deckt komplexe Queue-Claiming-SQL nicht vollständig durch seine komfortablen Modellmethoden ab; gezieltes Raw SQL bleibt notwendig und wird isoliert getestet.
- Next.js ist für den aktuellen Worker-/Adapter-Slice nicht erforderlich und wird deshalb noch nicht als Abhängigkeit installiert.

## Nicht Teil dieser Entscheidung

- Exakte Paketversionen und ein konkretes Container-Basisimage.
- Wahl der Testbibliothek.
- Security-Modell der internen Adapter-Authentisierung.
- Produktiver MariaDB-zu-PostgreSQL-Cutover.
