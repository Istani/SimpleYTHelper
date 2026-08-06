# ADR-007: Discord-Nachrichtenanhänge als eigene Relation

**Status:** vorgeschlagen – Entscheidung von Sascha ausstehend
**Datum:** 2026-08-06

## Kontext

Der SimpleYTH-Discord-Adapter persistiert eingehende Nachrichten derzeit in
`discord_message`. Der parallele Legacy-Selfbot unter
`/root/yours-mine/apps/discord_selfbot3` serialisiert Discord-Anhänge zwar,
hängt deren URLs jedoch zur Anzeige als `<img>`-Markup an den Nachrichtentext.

Dieser Ansatz ist nicht für die relationale Zielarchitektur geeignet: Eine
Nachricht kann mehrere Anhänge verschiedener Typen enthalten; der Text ist
damit nicht mehr fachlich rein und Datei-Metadaten gehen verloren. Embeds und
Stickers sind separate Discord-Objekte und werden nicht als Anhänge vermischt.

## Entscheidungsvorschlag

Für jeden Discord-Attachment wird eine eigene Relation
`discord_message_attachment` angelegt. Sie gehört ausschließlich dem
Discord-Adapter; externe bzw. andere SimpleYTH-Services verwenden später eine
versionierte HTTP-API statt direkter Datenbankzugriffe.

Vorgeschlagenes Prisma-Modell:

```prisma
model DiscordMessageAttachment {
  id          String   @id @map("attachment_id")
  messageId   String   @map("message_id")
  position    Int      @map("position")
  filename    String   @map("filename")
  url         String   @map("url")
  contentType String?  @map("content_type")
  sizeBytes   BigInt   @map("size_bytes")
  width       Int?     @map("width")
  height      Int?     @map("height")
  description String?  @map("description")
  isSpoiler   Boolean  @default(false) @map("is_spoiler")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  message DiscordMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@unique([messageId, position], map: "discord_message_attachment_position_key")
  @@index([messageId], map: "discord_message_attachment_message_idx")
  @@map("discord_message_attachment")
}
```

`DiscordMessage` erhält die inverse Relation `attachments
DiscordMessageAttachment[]`.

## Daten- und Laufzeitsemantik

- Der Event-Handler projiziert `message.attachments` als vollständige,
  geordnete Liste in strukturierte Attachment-Werte.
- `saveMessage` und die Attachment-Persistenz laufen in einer Prisma-
  Transaktion: Eine eingehende Nachricht und ihre zugehörigen Anhänge sind
  gemeinsam dauerhaft oder gar nicht gespeichert.
- Die Discord-`attachment_id` ist der Primärschlüssel. `position` bewahrt die
  Reihenfolge für die spätere Darstellung.
- Gespeichert werden nur von Discord gelieferte Metadaten und die CDN-URL.
  Ein Attachment wird nicht heruntergeladen, nicht proxyed und nicht in
  PostgreSQL als Blob gespeichert.
- CDN-/Proxy-URLs sind kein belastbarer Archivspeicher. Falls später eine
  revisionssichere Dateiaufbewahrung benötigt wird, ist dies ein separates
  Opt-in-Projekt mit Objekt-Storage, Malware-Scan, Größenlimits,
  Zugriffskontrolle und Lösch-/Retention-Konzept.
- Bei einer späteren `messageUpdate`-Unterstützung muss eine vollständige
  Attachment-Snapshot-Synchronisation veraltete Zeilen gezielt entfernen.
  Der aktuelle `messageCreate`-Pfad benötigt keine Löschung.

## Verworfene Alternativen

1. **URLs in `discord_message.content` einfügen:** Verlust der Textreinheit,
   keine strukturierten Metadaten, mehrdeutige Darstellung und schlechte
   Mehrfachanhang-Unterstützung.
2. **`attachments` als JSON-Spalte in `discord_message`:** Schnell umsetzbar,
   aber keine referenzielle Integrität, keine zielgerichtete Indizierung und
   spätere Abfragen/Migrationen bleiben unnötig aufwendig.
3. **Dateiblobs direkt in PostgreSQL speichern:** Für den aktuellen
   Ingestionsschritt unnötig teuer und sicherheits-/betriebsintensiv.

## Implementierungs-Gate

Vor einer Umsetzung braucht es Saschas ausdrückliche Freigabe dieses Modells.
Danach folgen testgetrieben: Prisma-Migration, Repository-Transaktion,
Event-Projektion, gezielte Tests für mehrere Anhänge/DMs/Dateitypen sowie die
bestehenden Build-, Healthcheck- und Loki-Abnahmen im Test-Compose-Betrieb.
