import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackupError } from './backup-errors';
import { chooseDelivery, deliverFile } from './file-delivery';

const blob = new Blob(['zip'], { type: 'application/zip' });

function stubNavigator(share: unknown, canShare: unknown, standalone = false): void {
  Object.defineProperty(navigator, 'share', { configurable: true, value: share });
  Object.defineProperty(navigator, 'canShare', { configurable: true, value: canShare });
  Object.defineProperty(navigator, 'standalone', { configurable: true, value: standalone });
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:fake');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  stubNavigator(undefined, undefined);
});

describe('chooseDelivery', () => {
  it('compartilha só no app instalado com suporte a arquivos', () => {
    expect(chooseDelivery({ standalone: true, canShareFiles: true })).toBe('share');
    expect(chooseDelivery({ standalone: true, canShareFiles: false })).toBe('download');
    expect(chooseDelivery({ standalone: false, canShareFiles: true })).toBe('download');
    expect(chooseDelivery({ standalone: false, canShareFiles: false })).toBe('download');
  });
});

describe('deliverFile', () => {
  it('baixa por âncora no navegador comum', async () => {
    vi.useFakeTimers();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    stubNavigator(undefined, undefined);

    await deliverFile(blob, 'certamecards-backup-2026-10-02.zip');

    expect(click).toHaveBeenCalledOnce();
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });

  it('compartilha o arquivo no app instalado', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    stubNavigator(share, () => true, true);

    await deliverFile(blob, 'backup.zip');

    expect(share).toHaveBeenCalledOnce();
    expect(share.mock.calls[0][0].files[0].name).toBe('backup.zip');
  });

  it('trata o cancelamento do compartilhamento como falha de entrega', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancelado', 'AbortError'));
    stubNavigator(share, () => true, true);

    await expect(deliverFile(blob, 'backup.zip')).rejects.toMatchObject({ code: 'delivery-failed' });
    await expect(deliverFile(blob, 'backup.zip')).rejects.toBeInstanceOf(BackupError);
  });
});
