export type NotetypeKind = 'normal' | 'cloze' | 'image-occlusion';

export interface AnkiNotetype {
  id: string;
  name: string;
  fields: string[];
  kind: NotetypeKind;
}

export interface AnkiNote {
  notetypeId: string;
  fields: string[];
  tags: string;
  deck: string;
}

export interface AnkiCollection {
  fileName: string;
  notetypes: AnkiNotetype[];
  notes: AnkiNote[];
}

export interface SqlResult {
  columns: string[];
  values: unknown[][];
}

export interface SqlRunner {
  exec(sql: string): SqlResult[];
}

export function queryRows(db: SqlRunner, sql: string): unknown[][] {
  return db.exec(sql)[0]?.values ?? [];
}

export function tableExists(db: SqlRunner, table: string): boolean {
  const names = queryRows(db, "SELECT name FROM sqlite_master WHERE type = 'table'");
  return names.some(([name]) => name === table);
}

export function idText(value: unknown): string {
  return typeof value === 'number' || typeof value === 'bigint' ? String(value) : String(value ?? '');
}
