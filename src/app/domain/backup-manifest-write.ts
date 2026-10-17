import { BACKUP_FORMAT, BACKUP_VERSION, imageEntryPath, type BackupContent, type BackupManifest, type ManifestMeta } from './backup-format';
import { toCardImageRow, toCardRow, toDeckRow, toLogRow, toSettingsRow } from './sync-rows';

export function toManifest(content: BackupContent, meta: ManifestMeta): BackupManifest {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: meta.exportedAt,
    accountId: meta.accountId,
    decks: content.decks.map(toDeckRow),
    cards: content.cards.map(toCardRow),
    reviewLogs: content.reviewLogs.map(toLogRow),
    settings: content.settings ? toSettingsRow(content.settings) : null,
    images: content.images.map((image) => ({ ...toCardImageRow(image), path: imageEntryPath(image.id, image.mimeType) })),
  };
}
