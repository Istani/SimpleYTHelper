# Phase 6 – Webfrontend-Container, Anmeldung und Rollenbereiche

**Stand:** lokaler Frontend-Slice implementiert und im Container geprüft  
**Datum:** 2026-08-05

## 1. Ziel und Ergebnis

Das neue Webfrontend läuft als eigenständige Next.js-16-Anwendung im Compose-Service
`web`. Das Multi-Stage-Image in `Dockerfile.web` verwendet Node.js 22.22 und führt
die Standalone-Runtime als unprivilegierter Benutzer aus.

Die Website besitzt drei fachliche Bereiche:

| Bereich | Route | Berechtigung |
|---|---|---|
| Administration und Verwaltung | `/admin` | `admin` |
| Content Creator / Streamer | `/creator` | `creator` |
| Content Viewer / Zuschauer | `/viewer` | `viewer` |

Der Login fragt den Benutzer nicht nach einer Rolle. Nach erfolgreicher Prüfung der
Zugangsdaten werden alle Berechtigungen automatisch aus dem Konto übernommen und
auf `/dashboard` als verfügbare Bereiche angezeigt.

## 2. Mehrfachrollen

Ein Konto besitzt eine Liste von Rollen und ist nicht auf genau einen Bereich
beschränkt. Dadurch werden fachlich notwendige Überschneidungen abgebildet:

- ein reiner Zuschauer besitzt `viewer`;
- ein Content Creator kann gleichzeitig `creator` und `viewer` besitzen;
- ein Administrator kann je nach Verantwortung zusätzlich Creator- und
  Viewer-Rechte erhalten.

Proxy und Server Components prüfen die Rollen serverseitig. Navigationseinträge
werden nur für freigegebene Bereiche angezeigt. Der direkte Aufruf einer nicht
freigegebenen Route führt zurück auf die persönliche Bereichsübersicht.

## 3. Session und Sicherheitsgrenze

Die lokale Anmeldung erzeugt eine auf acht Stunden begrenzte, signierte Session in
einem `HttpOnly`-/`SameSite=Lax`-Cookie. Hinter HTTPS wird das Cookie zusätzlich mit
`Secure` übertragen. `WEB_AUTH_SECRET` muss mindestens 32 Zeichen enthalten und
wird ausschließlich zur Laufzeit injiziert.

`WEB_USERS_JSON` ist ein temporärer Bootstrap-Provider für lokale Entwicklung und
geschlossene Smoke-Tests. Er ist ausdrücklich:

- kein öffentliches Benutzerregister;
- keine dauerhafte Datenhaltung;
- kein Ersatz für Passwort-Hashes, Accountverwaltung oder Provider-OAuth;
- nicht für den produktiven Betrieb vorgesehen.

## 4. Verbindliche PostgreSQL-Folgearbeit

**Login, Rollen und sämtliche fachlichen Nutzerdaten müssen vor einem öffentlichen
oder produktiven Betrieb an PostgreSQL angebunden werden.** Die aktuell per
`WEB_USERS_JSON` injizierten Testkonten werden danach entfernt.

Die geplante `identity-api` ist Owner der Identitätsdaten und persistiert mindestens:

| Datenbereich | Beispiele |
|---|---|
| Benutzerkonto | ID, Anzeigename, E-Mail, Status, Zeitstempel |
| Anmeldeidentität | Passwort-Hash oder externe OAuth-Identität, niemals Klartextpasswörter |
| Rollen und Rechte | `admin`, `creator`, `viewer` sowie die Zuordnung mehrerer Rollen pro Konto |
| Creator-Profil | Kanalidentitäten, öffentliche Profildaten und aktivierte Integrationen |
| Community-Zuordnung | welcher Viewer welchen Creatorn folgt bzw. deren Dienste nutzt |
| Session-/Security-Daten | widerrufbare Sessions, Rotation, letzte Anmeldung und sicherheitsrelevante Ereignisse |

Das Webfrontend darf diese Tabellen nicht direkt lesen oder schreiben. Es verwendet
eine versionierte Schnittstelle der `identity-api`; damit bleibt die in den übrigen
Architekturdokumenten festgelegte Datenownership erhalten. Der konkrete
PostgreSQL-Namensraum, Migrationen, OAuth-Provider und das Lösch-/Aufbewahrungsmodell
benötigen vor der Implementierung eine eigene Identity-ADR.

## 5. Gestaltung

Das historische Simple-YTH-Logo wurde als responsive Web-Komponente übernommen:
ein dunkelrotes, stark abgerundetes Quadrat mit `Simple` und der rechts anschließenden
Wortmarke `YTH`. Das daraus abgeleitete Markenrot `#970b0b` wird für Aktionen,
Fokuszustände und Bereichsakzente verwendet.

Die alte Gestaltung dient nur als Markenreferenz. Die neue Oberfläche verwendet
ein modernes, responsives Kartenlayout, klare Abstände, helle Flächen und kompakte,
abgerundete Bedienelemente.

## 6. Lokaler Start

1. `.env.example` als Vorlage verwenden und eigene Werte außerhalb von Git setzen.
2. `WEB_AUTH_SECRET` mit mindestens 32 zufälligen Zeichen setzen.
3. `WEB_USERS_JSON` ausschließlich mit lokalen Bootstrap-Konten befüllen.
4. Hinter HTTPS `WEB_COOKIE_SECURE=true` verwenden; `false` ist nur für lokale
   HTTP-Smoke-Tests zulässig.
5. `docker compose up --build web` ausführen.

Die Website ist standardmäßig auf Port 3000 erreichbar. `WEB_PORT` kann den
Host-Port ändern. `GET /api/health` ist der Docker-Healthcheck.

## 7. Ausführungsevidenz

Am 2026-08-05 wurden erfolgreich geprüft:

- `npm test`: 18/18 Tests erfolgreich, einschließlich Mehrfachrollen und Sessions;
- `npm run build:web`: Next.js-Produktionsbuild erfolgreich;
- `docker compose build web`: Multi-Stage-Image erfolgreich;
- gestarteter Container meldet `healthy`;
- Rollen werden ohne manuelle Auswahl aus den Zugangsdaten ermittelt;
- Admin sieht alle konfigurierten Bereiche;
- Creator sieht Creator- und Viewer-Bereich;
- Viewer sieht ausschließlich den Viewer-Bereich;
- Creator kann den Viewer-Bereich verwenden, aber nicht die Administration;
- Logo, Markenfarben, Login und Bereichsübersicht wurden im Browser visuell geprüft.

Die Prüfungen verwendeten ausschließlich lokale Testkonten. Die PostgreSQL-Instanz
auf `ym-server`, der produktive PM2-/MariaDB-Bestand und echte Providerkonten wurden
nicht verändert.

## 8. Offenes Abnahme-Gate

Der Frontend-Container und das UI-Rollenmodell sind lokal lauffähig. Der
Login-/Daten-Slice ist jedoch erst produktionsreif, wenn:

1. die Identity-ADR angenommen ist;
2. das PostgreSQL-Schema und seine Migrationen geprüft sind;
3. `identity-api` Konten, Mehrfachrollen und Community-Zuordnungen persistent führt;
4. Klartext-Bootstrap-Passwörter vollständig entfernt sind;
5. Registrierungs-, Login-, Logout-, Widerrufs- und Account-Löschpfade getestet sind;
6. Backup, Wiederherstellung, Datenschutz und Secret-Rotation betrieblich geklärt sind.

