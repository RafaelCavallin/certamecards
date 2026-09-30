import type { SupabaseClient } from '@supabase/supabase-js';

type Row = Record<string, unknown>;
type RpcHandler = (name: string, args: unknown) => { error: { message: string } | null };

export interface FakeSupabaseOptions {
  tables?: Record<string, Row[]>;
  session?: { user: { id: string } } | null;
  rpc?: RpcHandler;
}

export interface FakeSupabase {
  client: SupabaseClient;
  rpcCalls: { name: string; args: unknown }[];
}

export function createFakeSupabase(options: FakeSupabaseOptions = {}): FakeSupabase {
  const tables = options.tables ?? {};
  const rpcCalls: { name: string; args: unknown }[] = [];
  const client = {
    from: (table: string) => buildQuery(tables[table] ?? []),
    rpc: async (name: string, args: unknown) => {
      rpcCalls.push({ name, args });
      return options.rpc?.(name, args) ?? { error: null };
    },
    auth: {
      getSession: async () => ({ data: { session: options.session ? { user: options.session.user } : null } }),
      signOut: async () => ({ error: null }),
    },
  };
  return { client: client as unknown as SupabaseClient, rpcCalls };
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
