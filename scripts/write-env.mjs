import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseEnvFile, resolveVar } from './env-sources.mjs';

const ENV_KEYS = ['NG_APP_SUPABASE_URL', 'NG_APP_SUPABASE_PUBLISHABLE_KEY'];
const OUTPUT_PATH = 'src/environments/env.ts';

export function resolveSupabaseEnv(processEnv, dotEnvLocal, dotEnv) {
  const sources = [processEnv, dotEnvLocal, dotEnv];
  const [url, publishableKey] = ENV_KEYS.map((key) => resolveVar(key, sources));
  if (!url || !publishableKey) return null;
  return { supabaseUrl: url, supabasePublishableKey: publishableKey };
}

export function buildEnvFileContent(env) {
  const body = env ? JSON.stringify(env, null, 2) : 'null';
  return `export const env = ${body};\n`;
}

function main() {
  const dotEnvLocal = parseEnvFile('.env.local');
  const dotEnv = parseEnvFile('.env');
  const env = resolveSupabaseEnv(process.env, dotEnvLocal, dotEnv);
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, buildEnvFileContent(env));
}

if (process.argv[1] === import.meta.filename) {
  main();
}
