import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveSupabaseEnv, buildEnvFileContent } from './write-env.mjs';
import { parseEnvFile } from './env-sources.mjs';

describe('resolveSupabaseEnv', () => {
  it('resulta em null quando nenhuma variável está definida', () => {
    const env = resolveSupabaseEnv({}, {}, {});

    expect(env).toBeNull();
  });

  it('usa o valor do .env.local quando o .env também define a chave', () => {
    const dotEnv = { NG_APP_SUPABASE_URL: 'http://env', NG_APP_SUPABASE_PUBLISHABLE_KEY: 'k-env' };
    const dotEnvLocal = {
      NG_APP_SUPABASE_URL: 'http://local',
      NG_APP_SUPABASE_PUBLISHABLE_KEY: 'k-local',
    };

    const env = resolveSupabaseEnv({}, dotEnvLocal, dotEnv);

    expect(env).toEqual({ supabaseUrl: 'http://local', supabasePublishableKey: 'k-local' });
  });

  it('usa a variável do processo mesmo com .env e .env.local definidos', () => {
    const processEnv = {
      NG_APP_SUPABASE_URL: 'http://process',
      NG_APP_SUPABASE_PUBLISHABLE_KEY: 'k-process',
    };
    const dotEnvLocal = {
      NG_APP_SUPABASE_URL: 'http://local',
      NG_APP_SUPABASE_PUBLISHABLE_KEY: 'k-local',
    };
    const dotEnv = { NG_APP_SUPABASE_URL: 'http://env', NG_APP_SUPABASE_PUBLISHABLE_KEY: 'k-env' };

    const env = resolveSupabaseEnv(processEnv, dotEnvLocal, dotEnv);

    expect(env).toEqual({ supabaseUrl: 'http://process', supabasePublishableKey: 'k-process' });
  });

  it('resulta em null quando só uma das duas chaves está definida', () => {
    const env = resolveSupabaseEnv({ NG_APP_SUPABASE_URL: 'http://only' }, {}, {});

    expect(env).toBeNull();
  });
});

describe('buildEnvFileContent', () => {
  it('gera "export const env = null;" sem configuração', () => {
    const content = buildEnvFileContent(null);

    expect(content).toBe('export const env = null;\n');
  });

  it('gera o objeto com as duas chaves quando configurado', () => {
    const content = buildEnvFileContent({
      supabaseUrl: 'http://local',
      supabasePublishableKey: 'k-local',
    });

    expect(content).toContain('"supabaseUrl": "http://local"');
    expect(content).toContain('"supabasePublishableKey": "k-local"');
  });
});

describe('parseEnvFile', () => {
  it('lê pares KEY=VALUE ignorando comentários e linhas em branco', () => {
    const dir = mkdtempSync(join(tmpdir(), 'certamecards-env-'));
    const path = join(dir, '.env.local');
    writeFileSync(path, '# comentário\n\nNG_APP_SUPABASE_URL=http://local\nQUOTED="valor"\n');

    const values = parseEnvFile(path);

    rmSync(dir, { recursive: true, force: true });
    expect(values).toEqual({ NG_APP_SUPABASE_URL: 'http://local', QUOTED: 'valor' });
  });

  it('retorna objeto vazio quando o arquivo não existe', () => {
    const values = parseEnvFile('/caminho/que/nao/existe/.env');

    expect(values).toEqual({});
  });
});
