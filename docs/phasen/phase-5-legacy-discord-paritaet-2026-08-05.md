# Legacy-Discord-Parität – Entscheidungsstand 2026-08-05

## Quelle und Schutzrahmen

Der Bestand wurde ausschließlich aus `defender833:/root/SimpleYTHelper/discord` und den zugehörigen Legacy-Modellen analysiert. Zugangsdaten, Bot-Tokens, OAuth-Tokens und Datenbankverbindungswerte wurden weder kopiert noch dokumentiert.

Die Legacy-PM2-/MariaDB-Instanz bleibt produktiv, bis ein gesondert freigegebener Cutover mit Datenvalidierung und Rollback vorliegt. Diese Arbeit migriert keine Legacy-Daten und schaltet keine Bestandskomponente ab.

## Umgesetzt im modernen Discord-Bot-Adapter

| Legacy-Verhalten | Moderner Stand |
| --- | --- |
| Eingehende Guild-Nachrichten persistieren | vorhanden und weiterhin aktiv, wenn `listenMessages` gesetzt ist |
| Guilds, Channels und Rollen bei Start/`guildCreate` synchronisieren | vorhanden |
| Direct Messages persistieren | umgesetzt: DM-Channel und Nachricht haben keine erfundene Guild-Referenz |
| Nachrichten von Bot-Autoren persistieren | umgesetzt |
| Unicode-Emoji in die Legacy-Speicherform (`:shortcode:`) normalisieren | umgesetzt |
| Direct-Message-Intent und Channel-Partial | umgesetzt, nur bei `listenMessages` |
| Gateway-Fehler behandeln | umgesetzt: betroffene Bot-Runtime wird beendet; der bestehende Registrierungs-Poller startet sie wieder. Andere Bot-Runtimes bleiben verfügbar. |

Die PostgreSQL-Migration `20260806001500_support_direct_messages` lockert ausschließlich die bisherigen `NOT NULL`-Constraints für `discord_channel.guild_id` und `discord_message.guild_id`. Sie löscht oder verändert keine bestehenden Datensätze.

## Bewusst ausgeschlossen

### Ausgehende Nachrichten

Der Legacy-Ablauf `outgoing_messages`/`CheckForMessages`/`SendMessage` wird nicht implementiert. Der aktuelle Adapter sendet keine Discord-Nachrichten.

## Für einen späteren Entwicklungsschritt notiert

### Pruning/Purging

Die Legacy-Logik entfernte täglich Guild-Mitglieder nach 30 Tagen Inaktivität. Das ist ein externer, destruktiver Eingriff und bleibt deaktiviert. Eine spätere Umsetzung braucht mindestens eine explizite Guild-/Bot-Opt-in-Konfiguration, Dry-Run-Ausgabe, Audit-Log und einen klaren Zeitplan.

### OAuth-/Nutzerkanal-Synchronisation

Die Legacy-Logik las OAuth-Nutzertokens aus MariaDB, rief Discords `/users/@me` ab und schrieb eine Verknüpfung zurück. Das wird nicht in den Bot-Service eingebaut: Es benötigt einen getrennten OAuth-/User-Connection-Service mit eigener Datenownership und einer versionierten HTTP-API. Der Bot-Service erhält dabei keine direkten Zugriffe auf diese Datenbanktabellen.
