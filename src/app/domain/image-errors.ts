export type ImageErrorCode = 'unreadable' | 'too-large' | 'input-too-large' | 'storage-full';

const IMAGE_ERROR_MESSAGES: Record<ImageErrorCode, string> = {
  unreadable: 'Não foi possível abrir este arquivo como imagem.',
  'input-too-large': 'Esta imagem é grande demais para abrir.',
  'too-large': 'Esta imagem ficou grande demais mesmo reduzida.',
  'storage-full': 'Sem espaço no aparelho para salvar as imagens.',
};

export class ImageError extends Error {
  readonly code: ImageErrorCode;

  constructor(code: ImageErrorCode) {
    super(IMAGE_ERROR_MESSAGES[code]);
    this.name = 'ImageError';
    this.code = code;
  }
}
