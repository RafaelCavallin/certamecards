import { describe, it, expect } from 'vitest';
import { validateCardContent, FRONT_MAX, BACK_MAX, NOTES_MAX } from './card-limits';

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
});
