import { describe, it, expect } from 'vitest';
import {
  validateCardContent,
  FRONT_MAX,
  BACK_MAX,
  NOTES_MAX,
  TAGS_MAX,
  IMAGES_PER_CARD_MAX,
  IMAGE_SIDE_MAX,
  IMAGE_BYTES_MAX,
  IMAGE_CAPTION_MAX,
  IMAGE_INPUT_BYTES_MAX,
  IMAGE_MIME_TYPES,
} from './card-limits';

function content(overrides: Partial<{ front: string; back: string; notes: string }> = {}) {
  return { front: 'Frente', back: 'Verso', notes: '', ...overrides };
}

describe('validateCardContent', () => {
  it('aceita conteúdo exatamente no limite de cada campo', () => {
    const result = validateCardContent(
      content({ front: 'a'.repeat(FRONT_MAX), back: 'b'.repeat(BACK_MAX), notes: 'n'.repeat(NOTES_MAX) }),
    );

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('rejeita a Frente vazia', () => {
    const result = validateCardContent(content({ front: '   ' }));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('A Frente deve ter entre 1 e 5.000 caracteres.');
  });

  it('rejeita a Frente acima do limite', () => {
    const result = validateCardContent(content({ front: 'a'.repeat(FRONT_MAX + 1) }));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('A Frente deve ter entre 1 e 5.000 caracteres.');
  });

  it('rejeita o Verso vazio', () => {
    const result = validateCardContent(content({ back: '' }));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('O Verso deve ter entre 1 e 5.000 caracteres.');
  });

  it('rejeita Notas acima do limite', () => {
    const result = validateCardContent(content({ notes: 'n'.repeat(NOTES_MAX + 1) }));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('As Notas devem ter no máximo 20.000 caracteres.');
  });

  it('aceita Notas vazias', () => {
    const result = validateCardContent(content({ notes: '' }));

    expect(result.valid).toBe(true);
  });

  it('acumula um erro por campo inválido', () => {
    const result = validateCardContent({ front: '', back: '', notes: 'n'.repeat(NOTES_MAX + 1) });

    expect(result.errors).toHaveLength(3);
  });

  it('aceita exatamente 20 etiquetas', () => {
    const tags = Array.from({ length: TAGS_MAX }, (_, index) => `t${index}`);

    expect(validateCardContent({ ...content(), tags }).valid).toBe(true);
  });

  it('rejeita 21 etiquetas com a mensagem de limite', () => {
    const tags = Array.from({ length: TAGS_MAX + 1 }, (_, index) => `t${index}`);

    const result = validateCardContent({ ...content(), tags });

    expect(result).toEqual({ valid: false, errors: ['Limite de 20 etiquetas'] });
  });
});

describe('limites de imagem', () => {
  it('espelham os check de card_images e do bucket card-images', () => {
    expect({
      perCard: IMAGES_PER_CARD_MAX,
      side: IMAGE_SIDE_MAX,
      bytes: IMAGE_BYTES_MAX,
      caption: IMAGE_CAPTION_MAX,
      mimes: IMAGE_MIME_TYPES,
    }).toEqual({ perCard: 6, side: 2000, bytes: 1_572_864, caption: 200, mimes: ['image/webp', 'image/jpeg'] });
  });

  it('recusa entrada acima de 50 MB', () => {
    expect(IMAGE_INPUT_BYTES_MAX).toBe(50 * 1024 * 1024);
  });
});
