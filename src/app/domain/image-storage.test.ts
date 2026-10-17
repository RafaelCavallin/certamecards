import { describe, expect, it } from 'vitest';
import { errorCode, imagePath, isDuplicateUpload } from './image-storage';

describe('isDuplicateUpload', () => {
  it('reconhece o 409 pelo status, pelo statusCode e pela mensagem', () => {
    expect(isDuplicateUpload({ status: 409 })).toBe(true);
    expect(isDuplicateUpload({ statusCode: '409' })).toBe(true);
    expect(isDuplicateUpload({ message: 'The resource already exists' })).toBe(true);
    expect(isDuplicateUpload({ message: 'Duplicate' })).toBe(true);
  });

  it('não confunde outras falhas com reenvio', () => {
    expect(isDuplicateUpload({ status: 403, message: 'forbidden' })).toBe(false);
    expect(isDuplicateUpload({ status: 413, statusCode: '413' })).toBe(false);
    expect(isDuplicateUpload(null)).toBe(false);
    expect(isDuplicateUpload('erro')).toBe(false);
  });
});

describe('imagePath e errorCode', () => {
  it('monta o caminho na pasta do usuário', () => {
    expect(imagePath('u1', 'i1')).toBe('u1/i1');
  });

  it('resume o erro por código, statusCode ou status', () => {
    expect([errorCode({ code: '23514' }), errorCode({ statusCode: '413' }), errorCode({ status: 500 }), errorCode({}), errorCode(null)]).toEqual([
      '23514', '413', '500', 'sem código', 'desconhecido',
    ]);
  });
});
