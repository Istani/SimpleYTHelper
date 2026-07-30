# SimpleYTH – Phase 1: Kommunikationsgraph und Integrationslücken

**Stand:** 2026-07-30  
**Methode:** ausschliesslich lesende Quellcode-, Paket- und Prozessanalyse des produktiven Checkouts auf `defender833`.

## Korrektur der bisherigen Annahme

Die offenen Ports 3000–3006 und 4001 sind nach aktueller Evidenz **keine nachweisbaren serviceübergreifenden HTTP-APIs**. Sie dienen überwiegend Webseiten, OAuth-Callbacks oder Socket.IO/WebSocket-Schnittstellen für Browser- bzw. UI-Clients.

Aus ihnen darf weder ein bestehender API-Vertrag noch ein interner Serviceaufruf abgeleitet werden.

## Heutige Kommunikationswege

| Mechanismus | Beteiligte Komponenten | Befund | Architekturwirkung |
|---|---|---|---|
| Gemeinsame MariaDB | nahezu alle PM2-Module | Der belastbare gemeinsame Kommunikations- und Datenkopplungskanal; mehrere Services lesen und schreiben identische Tabellen. | Muss schrittweise durch klare Datenowner ersetzt werden. |
| Socket.IO / WebSocket | `website`, `mini`, `rpg`, `chatcommands`, `youtube/server` ↔ Browser | Server erzeugen Socket.IO-Endpunkte und emittieren UI-Ereignisse wie `log`, `command`, `sound`, `Link`, `channels` oder `videos`. | Client-Realtime, nicht als belastbarer Service-Bus nachgewiesen. |
| Externe HTTP-Aufrufe | Importer / Integrationen ↔ Discord, Twitch, YouTube, Steam, GOG, Epic, RSS usw. | `request` bzw. externe Provider-APIs sind verbreitet. | Das sind Adapter-zu-Provider-Verbindungen, keine SimpleYTH-Inter-Service-APIs. |
| Lokale HTTP-/Webseitenrouten | `website`, `gamesite`, `mini`, `shortlinks`, `twitter_auth` | Express und teils OAuth-Callbacks; z. B. `twitter_auth` mit Localhost-Callback-Routen. | Zunächst als UI-/Adapter-Routen behandeln, nicht als API-Contract übernehmen. |
| Gemeinsames Dateisystem / Prozesssteuerung | Root-`app.js`, `cronjob`, diverse Adapter | Update-, Backup- und Dateioperationen; Root-App kann `pm2 restart all` ausführen. | Separater Betriebsrisikopfad; kein fachlicher Kommunikationsvertrag. |
| Message-Broker / Event-Queue | — | Kein Redis, Bull, AMQP, Kafka, NATS oder MQTT als Laufzeitabhängigkeit nachgewiesen. | Ein asynchroner Integrationsmechanismus muss bewusst neu eingeführt werden, falls benötigt. |

## Schlussfolgerung

Die Legacy-Topologie ist ein **Shared-Database-System mit browserorientierten Realtime-Endpunkten**, nicht ein System unabhängiger HTTP-Microservices. Eine Docker-Compose-Abbildung der heutigen PM2-Ordner würde die DB-Kopplung und unklare Verantwortlichkeit nur containerisieren.

## Zielbild: zwei bewusst getrennte Integrationsarten

Die Zielarchitektur muss nicht die heutigen Ports in „APIs umbenennen“. Stattdessen werden pro Abhängigkeit zwei neue, explizite Wege entschieden:

1. **Synchroner fachlicher Request/Response:** eine kleine, versionierte interne HTTP-API des Datenowners – nur für Aufrufe, die eine unmittelbare Antwort benötigen.
2. **Asynchrone Zustandsänderung / Benachrichtigung:** Domain Events über einen dedizierten Broker oder eine Outbox-basierte Zustellung. Das entkoppelt Importer, Discord-Bot und andere Adapter vom Datenbank-Owner.
3. **Browser-Realtime:** Socket.IO/WebSocket bleibt ein Edge-/Gateway-Thema. Es konsumiert Daten und Events über die Owner-Schnittstellen; es wird nicht selbst zum Owner oder internen Event-Broker.

## Entscheidungsvorbereitung: Integrationsoptionen

| Option | Wirkung | Bewertung |
|---|---|---|
| Nur versionierte interne HTTP-APIs | Einfacher Start, geringer zusätzlicher Betrieb; bei vielen Events aber enge Laufzeitkopplung. | Gut für den ersten kleinen, synchronen Slice. |
| HTTP-APIs plus Broker von Beginn an | Saubere Entkopplung für Events, aber zusätzliche Infrastruktur, Betrieb und Delivery-Semantik. | Sinnvoll erst für bestätigte Mehrschreiber-/Event-Domänen. |
| Datenbank-Polling als Übergang | Schnell, aber versteckte Kopplung und unklare Zustellgarantien. | Nicht als Zielmechanismus empfohlen. |
| Socket.IO zwischen Backend-Services | Wiederverwendung bestehender Technik, aber Client-orientiertes Protokoll ohne klare Contract-/Delivery-Disziplin. | Nicht empfohlen. |

**Vorläufige Empfehlung:** Für den ersten vertikalen Slice einen klaren Datenowner mit einer kleinen synchronen HTTP-API aufbauen. Erst nach der Auslöser- und Zustellungsanalyse der `outgoing_messages`-/Chat- und Import-Workflows über einen Broker bzw. Transactional Outbox entscheiden.

## Nächste Evidenz

1. UI-/Socket.IO-Ereignisse ihren Browser-Konsumenten und auslösenden Datenänderungen zuordnen.
2. `outgoing_messages`, `send_tweet` und Import-Workflows als Kandidaten für asynchrone Events bis zu ihrem Trigger verfolgen.
3. Für einen risikoarmen Owner-Slice konkrete Request/Response-Fälle benennen; keine heute bestehende Webroute als API-Vertrag umdeuten.
