# ADR-004 – Leichtgewichtige interne Authentifizierung für den Discord-Adapter

**Status:** angenommen
**Datum:** 2026-08-05

## Kontext

Der erste Modernisierungsslice führt einen eigenständigen Discord-Adapter mit der
internen Route `POST /internal/v1/deliveries` ein. Die Komponenten laufen zunächst
im selben VPN-/Docker-Netz. Das Netz begrenzt die Erreichbarkeit, ersetzt aber keine
Authentifizierung: Ein fehlkonfigurierter oder später hinzukommender Container dürfte
sonst Zustellungen im Namen des Community-Kontexts annehmen lassen.

Sascha möchte bewusst keine unverhältnismäßig schwere PKI-/mTLS-Infrastruktur für
diesen frühen Slice. Authentisierung bleibt jedoch verbindlich.

## Entscheidung

1. Der Adapter akzeptiert interne Zustellungen nur mit einem Bearer-Token im Header
   `Authorization: Bearer <token>`.
2. Der Token wird ausschließlich zur Laufzeit als Secret injiziert. Er wird weder in
   Git, Compose, Images, Testfixtures noch Logs abgelegt.
3. Der Adapter verweigert den Start bei einem fehlenden oder leeren Token und
   vergleicht Kandidaten mit einer längensicheren, timing-sicheren Vergleichsfunktion.
4. Fehlende, falsch formatierte oder nicht passende Tokens führen vor jedem
   Ledger-Zugriff zu `401 Unauthorized`.
5. Der Adapter erhält keinen öffentlichen Listener. Seine Erreichbarkeit bleibt auf
   das entschiedene interne VPN-/Docker-Netz beschränkt.

## Bewusst nicht gewählt

- **Keine mTLS-/PKI-Einführung im ersten Slice:** Der Betriebsaufwand steht derzeit
  nicht im Verhältnis zur geschlossenen VPN-Umgebung und einem einzigen internen
  Aufrufer.
- **Keine IP-Allowlist als alleinige Authentisierung:** Container-IPs und
  Netzmitgliedschaften sind keine belastbare Absenderidentität.
- **Keine Discord-Bot-Authentisierung für die interne Route:** Discord-Credentials
  bleiben ausschließlich beim späteren Transport-Client des Adapters.

## Folgen

- Ein kompromittierter VPN-Teilnehmer kann den Token weiterhin missbrauchen; das
  Risiko wird mit kurzer, zufälliger Secret-Erzeugung und geplanter Rotation
  begrenzt, nicht als vollständig beseitigt ausgegeben.
- Bei steigender Dienstzahl, offenem Netz oder höherem Schutzbedarf wird diese ADR
  erneut bewertet; mTLS oder Workload-Identity sind dann mögliche Nachfolger.
- Die konkrete Secret-Injektion, Rotation und Docker-Netzmitgliedschaft werden mit
  Mia implementiert und vor dem ersten produktiven Deployment abgenommen.
