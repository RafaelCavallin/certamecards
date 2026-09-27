import { readFileSync, existsSync } from 'node:fs';

const ASSIGNMENT_PATTERN = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/;

export function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const lines = readFileSync(path, 'utf8').split('\n');
  return lines.reduce((values, line) => addAssignment(values, line), {});
}

function addAssignment(values, rawLine) {
  const line = rawLine.trim();
  const match = line.match(ASSIGNMENT_PATTERN);
  if (!match) return values;
  const [, key, rawValue] = match;
  return { ...values, [key]: unquote(rawValue.trim()) };
}

function unquote(value) {
  const isQuoted = value.startsWith('"') && value.endsWith('"');
  return isQuoted ? value.slice(1, -1) : value;
}

export function resolveVar(key, sources) {
  return sources.reduce((found, source) => found || source[key] || '', '');
}
