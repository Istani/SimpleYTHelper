# ADR-007: Strukturierte Medien zu Discord-Nachrichten

**Status:** akzeptiert – Umsetzung im Docker-Testbetrieb
**Datum:** 2026-08-06

## Kontext

Der SimpleYTH-Discord-Adapter persistiert eingehende Nachrichten derzeit in
`discord_message`. Der Legacy-Selfbot unter
`/root/yours-mine/apps/discord_selfbot3` hängt Attachment-, Embed- und
Sticker-URLs zur Darstellung als `<img>`-Markup an den Nachrichtentext.

Das ist für die relationale Zielarchitektur ungeeignet: Der Text ist nicht
mehr fachlich rein, mehrere Medien sind nicht zuverlässig abbildbar und
Datei-/Typ-Metadaten bleiben unstrukturiert. Sascha hat entschieden, dass
Attachments, Embeds und Stickers zur eingehenden Nachricht gehören und im
Frontend sichtbar sein müssen — ohne Inline-Bilder oder Medienvorschauen.

## Entscheidung

Der Discord-Adapter besitzt die Relation `discord_message_media`. Jede Zeile
referenziert genau eine Discord-Nachricht und hat einen expliziten Typ:

```prisma
enum DiscordMessageMediaKind {
  attachment
  embed
  sticker
}

model DiscordMessageMedia {
  id          String                  @id @default(uuid()) @db.Uuid
  messageId   String                  @map("message_id")
  kind        DiscordMessageMediaKind
  position    Int
  sourceId    String?                 @map("source_id")
  label       String
  url         String?
  contentType String?                 @map("content_type")
  sizeBytes   Int?                    @map("size_bytes")
  width       Int?
  height      Int?
  description String?
  isSpoiler   Boolean                 @default(false) @map("is_spoiler")

  message DiscordMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@unique([messageId, kind, position])
  @@index([messageId])
}
```

Die Prisma-Migration `20260806113837_add_discord_message_media` wurde aus dem
Schema gegen ein isoliertes, temporäres PostgreSQL erzeugt und dort per
`prisma migrate deploy` erfolgreich angewendet. Tabelle und PostgreSQL-Enum
wurden anschließend ausschließlich über Schema-Metadaten nachgewiesen. Der
Temporärcontainer und das zugehörige Docker-Netz wurden entfernt.

## Daten- und Laufzeitsemantik

- `message.attachments`, `message.embeds` und `message.stickers` werden als
  vollständige, geordnete Liste zu strukturierten Medienzeilen projiziert.
- Für Attachments und Stickers speichert `source_id` die Discord-Objekt-ID;
  Embeds benötigen keine vorgetäuschte externe ID.
- `saveMessage` ersetzt den vollständigen Medien-Snapshot zusammen mit der
  Nachricht in einer Prisma-Transaktion. Das ist auch für eine spätere
  `messageUpdate`-Synchronisierung geeignet.
- Persistiert werden ausschließlich Metadaten und von Discord gelieferte
  URLs. Es gibt weder Download noch Proxy noch Blob-Speicherung in PostgreSQL.
- Discord-CDN-/Proxy-URLs sind kein Archivspeicher. Dauerhafte Dateisicherung
  ist ein bewusst separates Opt-in mit Objekt-Storage, Größenlimits,
  Malware-Scan, Zugriffskontrolle und Retention-Konzept.

## Frontend-Verhalten

Die Verwaltungsansicht zeigt Medien direkt unter dem Nachrichtentext als
Textliste, nicht als Vorschau:

- `📎 Datei: <Dateiname>`
- `🔗 Embed: <Titel>`
- `🏷️ Sticker: <Name>`

Bei einer gültigen HTTP(S)-URL ist der Name ein externer Link mit
`target="_blank"` und `rel="noreferrer"`. Nicht-HTTP(S)-URLs werden nicht
verlinkt. Es werden keine `<img>`-, Video-, Audio- oder Embed-Elemente
verwendet.

## Abgrenzung

Die Relation ist Eigentum des Discord-Adapters. Andere SimpleYTH-Services
verwenden künftig eine versionierte HTTP-API und erhalten keinen neuen
Direktzugriff auf diese Tabellen. Der bestehende PM2-Produktivbestand bleibt
bei Umsetzung und Testrollout unverändert.
