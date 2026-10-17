import { BackupError } from './backup-errors';

const STANDALONE_QUERY = '(display-mode: standalone)';
const REVOKE_DELAY_MS = 1000;

export interface DeliveryEnvironment {
  standalone: boolean;
  canShareFiles: boolean;
}

export function chooseDelivery(env: DeliveryEnvironment): 'share' | 'download' {
  return env.standalone && env.canShareFiles ? 'share' : 'download';
}

function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || (typeof matchMedia === 'function' && matchMedia(STANDALONE_QUERY).matches);
}

function detectEnvironment(file: File): DeliveryEnvironment {
  const canShareFiles = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  return { standalone: isStandalone(), canShareFiles };
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

export async function deliverFile(blob: Blob, fileName: string): Promise<void> {
  const file = new File([blob], fileName, { type: blob.type });
  try {
    if (chooseDelivery(detectEnvironment(file)) === 'share') await navigator.share({ files: [file], title: fileName });
    else triggerDownload(blob, fileName);
  } catch (error: unknown) {
    throw new BackupError('delivery-failed', { cause: error });
  }
}
