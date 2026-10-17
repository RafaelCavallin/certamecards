import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { zipSync } from 'fflate';
import initSqlJs from 'sql.js';

const OUTPUT = new URL('../src/test/anki-fixtures.ts', import.meta.url);
const require = createRequire(import.meta.url);

const MODERN_SCHEMA = [
  'CREATE TABLE col (id integer primary key, ver integer)',
  'CREATE TABLE notetypes (id integer NOT NULL PRIMARY KEY, name text NOT NULL, mtime_secs integer NOT NULL, usn integer NOT NULL, config blob NOT NULL)',
  'CREATE TABLE fields (ntid integer NOT NULL, ord integer NOT NULL, name text NOT NULL, config blob NOT NULL, PRIMARY KEY (ntid, ord)) without rowid',
  'CREATE TABLE decks (id integer PRIMARY KEY NOT NULL, name text NOT NULL, mtime_secs integer NOT NULL, usn integer NOT NULL, common blob NOT NULL, kind blob NOT NULL)',
  'CREATE TABLE notes (id integer PRIMARY KEY, guid text NOT NULL, mid integer NOT NULL, mod integer NOT NULL, usn integer NOT NULL, tags text NOT NULL, flds text NOT NULL, sfld integer NOT NULL, csum integer NOT NULL, flags integer NOT NULL, data text NOT NULL)',
  'CREATE TABLE cards (id integer PRIMARY KEY, nid integer NOT NULL, did integer NOT NULL, ord integer NOT NULL, odid integer NOT NULL)',
];

const BASIC = 1738205931998;
const CLOZE = 1738205932002;
const OCCLUSION = 1738205932003;

const NOTETYPES = [
  [BASIC, 'Básico', [0x1a, 0x02, 0x2e, 0x63, 0x48, 0x01], ['Frente', 'Verso']],
  [CLOZE, 'Omissão de Palavras', [0x08, 0x01, 0x1a, 0x02, 0x2e, 0x63, 0x48, 0x05], ['Texto', 'Verso Extra']],
  [OCCLUSION, 'Oclusão de Imagem', [0x08, 0x01, 0x1a, 0x01, 0x2e, 0x48, 0x06], ['Occlusion', 'Image', 'Header', 'Back Extra', 'Comments']],
];

const DECKS = [
  [1, 'DevOps'],
  [1738209271675, 'Engenharia de Software\u001fRequisitos'],
];

const NOTES = [
  [BASIC, 1, ['O que é <b>DevOps</b>?', 'Cultura que une<div>desenvolvimento e operação</div>'], ' cespe '],
  [CLOZE, 1738209271675, ['A {{c1::elicitação}} vem antes da {{c2::validação}}', 'IEEE 830'], ' fgv requisitos '],
  [OCCLUSION, 1738209271675, ['{{c1::image-occlusion:rect:left=.1:top=.2}}', '<img src="a.png">', '', '', ''], ''],
];

async function buildModernCollection(SQL) {
  const db = new SQL.Database();
  MODERN_SCHEMA.forEach((sql) => db.run(sql));
  db.run('INSERT INTO col VALUES (1, 18)');
  for (const [id, name, config, fields] of NOTETYPES) {
    db.run('INSERT INTO notetypes VALUES (?, ?, 0, 0, ?)', [id, name, new Uint8Array(config)]);
    fields.forEach((field, ord) => db.run('INSERT INTO fields VALUES (?, ?, ?, ?)', [id, ord, field, new Uint8Array()]));
  }
  for (const [id, name] of DECKS) db.run("INSERT INTO decks VALUES (?, ?, 0, 0, x'', x'')", [id, name]);
  NOTES.forEach(([notetype, deck, fields, tags], index) => {
    const id = index + 1;
    db.run("INSERT INTO notes VALUES (?, 'g', ?, 0, 0, ?, ?, 0, 0, 0, '')", [id, notetype, tags, fields.join('\u001f')]);
    db.run('INSERT INTO cards VALUES (?, ?, ?, 0, 0)', [id, id, deck]);
  });
  addUnicaseCollation(db);
  return exportAndClose(db);
}

function addUnicaseCollation(db) {
  db.run('PRAGMA writable_schema = ON');
  db.run(
    "UPDATE sqlite_master SET sql = replace(sql, 'name text NOT NULL', 'name text NOT NULL COLLATE unicase') WHERE name IN ('notetypes', 'fields', 'decks')",
  );
  db.run('PRAGMA writable_schema = OFF');
}

function buildDecoyCollection(SQL) {
  const db = new SQL.Database();
  db.run('CREATE TABLE col (id integer primary key, models text, decks text)');
  db.run('CREATE TABLE notes (id integer primary key, mid integer, tags text, flds text)');
  db.run(`INSERT INTO col VALUES (1, '{"1":{"name":"Basic","type":0,"flds":[{"name":"Front","ord":0}]}}', '{}')`);
  db.run("INSERT INTO notes VALUES (1, 1, '', 'Please update to the latest Anki version')");
  return exportAndClose(db);
}

function exportAndClose(db) {
  const bytes = db.export();
  db.close();
  return bytes;
}

function zstd(bytes) {
  return new Uint8Array(execFileSync('zstd', ['-q', '-c', '-19'], { input: bytes }));
}

const SQL = await initSqlJs({ wasmBinary: readFileSync(require.resolve('sql.js/dist/sql-wasm.wasm')) });
const zip = zipSync({
  meta: new Uint8Array([0x08, 0x03]),
  'collection.anki21b': zstd(await buildModernCollection(SQL)),
  'collection.anki2': buildDecoyCollection(SQL),
});
const base64 = Buffer.from(zip).toString('base64');
writeFileSync(
  OUTPUT,
  `export const ANKI21B_COLPKG_BASE64 =\n  '${base64}';\n\nexport function anki21bPackage(): Uint8Array {\n  return Uint8Array.from(atob(ANKI21B_COLPKG_BASE64), (char) => char.charCodeAt(0));\n}\n`,
);
console.log(`anki-fixtures.ts: ${zip.length} bytes`);
