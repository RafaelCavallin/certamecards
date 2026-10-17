export interface StorageFailure {
  message: string;
  status?: number;
  statusCode?: string;
}

export interface FakeStorageOptions {
  files?: Record<string, Blob>;
  uploadError?: (path: string) => StorageFailure | null;
  downloadError?: (path: string) => StorageFailure | null;
  removeError?: (paths: string[]) => StorageFailure | null;
}

export interface BucketContext {
  options: FakeStorageOptions;
  files: Map<string, Blob>;
  calls: string[];
}

const DUPLICATE: StorageFailure = { message: 'The resource already exists', status: 409, statusCode: '409' };
const NOT_FOUND: StorageFailure = { message: 'Object not found', status: 404, statusCode: '404' };

export function buildBucket({ options, files, calls }: BucketContext) {
  return {
    upload: async (path: string, body: Blob) => {
      calls.push(`upload:${path}`);
      const error = options.uploadError?.(path) ?? (files.has(path) ? DUPLICATE : null);
      if (!error) files.set(path, body);
      return { data: error ? null : { path }, error };
    },
    download: async (path: string) => {
      calls.push(`download:${path}`);
      const error = options.downloadError?.(path) ?? (files.has(path) ? null : NOT_FOUND);
      return { data: error ? null : (files.get(path) as Blob), error };
    },
    remove: async (paths: string[]) => {
      calls.push(`remove:${paths.join(',')}`);
      const error = options.removeError?.(paths) ?? null;
      if (!error) paths.forEach((path) => files.delete(path));
      return { data: error ? null : [], error };
    },
  };
}
