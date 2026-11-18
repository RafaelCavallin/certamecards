import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';

describe('routes', () => {
  it('declara um título não vazio em toda rota', () => {
    const untitled = routes.filter((route) => typeof route.title !== 'string' || route.title.trim() === '');

    expect(untitled.map((route) => route.path)).toEqual([]);
  });

  it('não repete o mesmo título em duas rotas', () => {
    const titles = routes.map((route) => route.title);

    expect(new Set(titles).size).toBe(titles.length);
  });
});
