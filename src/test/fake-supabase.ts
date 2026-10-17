import type { SupabaseClient } from '@supabase/supabase-js';

import { buildBucket, type FakeStorageOptions } from './fake-storage';

export type { FakeStorageOptions, StorageFailure } from './fake-storage';

type Row = Record<string, unknown>;
interface RpcResult {
  error: { message: string; code?: string } | null;
}
type RpcHandler = (name: string, args: unknown) => RpcResult | Promise<RpcResult>;

export interface FakeSupabaseOptions {
  tables?: Record<string, Row[]>;
  session?: { user: { id: string } } | null;
  rpc?: RpcHandler;
  storage?: FakeStorageOptions;
}

export interface FakeSupabase {
  client: SupabaseClient;
  rpcCalls: { name: string; args: unknown }[];
  calls: string[];
  files: Map<string, Blob>;
}

export function createFakeSupabase(options: FakeSupabaseOptions = {}): FakeSupabase {
  const tables = options.tables ?? {};
  const rpcCalls: { name: string; args: unknown }[] = [];
  const calls: string[] = [];
  const files = new Map<string, Blob>(Object.entries(options.storage?.files ?? {}));
  const client = {
    from: (table: string) => buildQuery(tables[table] ?? []),
    rpc: async (name: string, args: unknown) => {
      rpcCalls.push({ name, args });
      calls.push(`rpc:${name}`);
      return (await options.rpc?.(name, args)) ?? { error: null };
    },
    storage: { from: () => buildBucket({ options: options.storage ?? {}, files, calls }) },
    auth: {
      getSession: async () => ({ data: { session: options.session ? { user: options.session.user } : null } }),
      signOut: async () => ({ error: null }),
    },
  };
  return { client: client as unknown as SupabaseClient, rpcCalls, calls, files };
}

function buildQuery(allRows: Row[]) {
  let rows = allRows;
  const builder = {
    select: () => builder,
    gt: (column: string, value: string) => {
      rows = rows.filter((row) => String(row[column]) > value);
      return builder;
    },
    eq: (column: string, value: unknown) => {
      rows = rows.filter((row) => row[column] === value);
      return countResult(rows);
    },
    order: () => builder,
    limit: (count: number) => Promise.resolve({ data: rows.slice(0, count), error: null }),
  };
  return builder;
}

function countResult(rows: Row[]): Promise<{ count: number }> {
  return Promise.resolve({ count: rows.length });
}
