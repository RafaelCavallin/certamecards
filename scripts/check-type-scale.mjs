import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const TARGET_EXTENSIONS = ['.html', '.ts'];
const SCAN_ROOT = 'src/app';
const MIN_LABEL_PX = 13;
const FORBIDDEN_PATTERNS = [
  { name: 'text-xs', regex: /\btext-xs\b/ },
  { name: 'text-[Npx]/text-[Nrem]', regex: /\btext-\[[^\]]+\]/ },
  { name: 'cor em hex', regex: /#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{8}\b/ },
];
const FONT_SIZE_PX_REGEX = /font-size:\s*(\d+(?:\.\d+)?)px/g;

export function findViolations(content) {
  const lines = content.split('\n');
  return lines.flatMap((line, index) => violationsInLine(line, index + 1));
}

function violationsInLine(line, lineNumber) {
  const classViolations = FORBIDDEN_PATTERNS.filter((pattern) => pattern.regex.test(line)).map((pattern) => ({
    pattern: pattern.name,
    line: lineNumber,
  }));
  return [...classViolations, ...fontSizeViolationsInLine(line, lineNumber)];
}

function fontSizeViolationsInLine(line, lineNumber) {
  return [...line.matchAll(FONT_SIZE_PX_REGEX)]
    .filter((match) => Number(match[1]) < MIN_LABEL_PX)
    .map(() => ({ pattern: 'font-size inline abaixo de 13px', line: lineNumber }));
}

export function listSourceFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(path);
    return TARGET_EXTENSIONS.includes(extname(path)) ? [path] : [];
  });
}

function main() {
  const violations = listSourceFiles(SCAN_ROOT).flatMap((file) => {
    const content = readFileSync(file, 'utf8');
    return findViolations(content).map((violation) => ({ file, ...violation }));
  });
  if (violations.length === 0) {
    console.log('check:type-scale: nenhuma violação encontrada.');
    return;
  }
  violations.forEach(({ file, line, pattern }) => {
    console.error(`${file}:${line} — proibido: ${pattern}`);
  });
  process.exitCode = 1;
}

if (process.argv[1] === import.meta.filename) {
  main();
}
