import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '../../environments/env';

interface SyncConfig {
  supabaseUrl: string;
  supabasePublishableKey: string;
}

const config = env as SyncConfig | null;

let clientPromise: Promise<SupabaseClient> | null = null;

export function isSyncConfigured(): boolean {
  return config !== null;
}

export function getSupabase(): Promise<SupabaseClient | null> {
  if (!config) return Promise.resolve(null);
  if (!clientPromise) clientPromise = createClient(config);
  return clientPromise;
}

async function createClient(settings: SyncConfig): Promise<SupabaseClient> {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(settings.supabaseUrl, settings.supabasePublishableKey);
}
