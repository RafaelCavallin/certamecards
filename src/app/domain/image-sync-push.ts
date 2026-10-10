import type { SupabaseClient } from '@supabase/supabase-js';
import { pushImageMetadata } from './image-sync-metadata';
import { purgeImageFiles } from './image-sync-remove';
import { uploadPendingImages, type PhaseResult } from './image-sync-upload';
import { warnImage } from './image-storage';

export interface ImagePushResult {
  pushed: number;
  failed: number;
}

async function runPhase(phase: string, work: () => Promise<PhaseResult>): Promise<PhaseResult> {
  try {
    return await work();
  } catch (error: unknown) {
    warnImage({ phase, ids: [], error });
    return { done: 0, failed: 1 };
  }
}

export async function pushImages(client: SupabaseClient, userId: string): Promise<ImagePushResult> {
  const upload = await runPhase('upload', () => uploadPendingImages(client, userId));
  const metadata = await runPhase('metadata', () => pushImageMetadata(client));
  const remove = await runPhase('remove', () => purgeImageFiles(client, userId));
  return { pushed: metadata.done, failed: upload.failed + metadata.failed + remove.failed };
}
