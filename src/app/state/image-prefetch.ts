import { DestroyRef, Service, inject } from '@angular/core';
import { fetchMissingImages } from '../domain/image-download';

export type PrefetchSource = 'screen' | 'queue';

@Service()
export class ImagePrefetch {
  private readonly requested = new Map<PrefetchSource, string[]>();

  constructor() {
    const retry = () => void fetchMissingImages(this.allRequested());
    window.addEventListener('online', retry);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('online', retry));
  }

  request(cardIds: string[], source: PrefetchSource = 'screen'): Promise<number> {
    this.requested.set(source, cardIds);
    return fetchMissingImages(cardIds).catch(() => 0);
  }

  private allRequested(): string[] {
    return [...new Set([...this.requested.values()].flat())];
  }
}
