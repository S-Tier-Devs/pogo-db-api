import { describe, it, expect } from 'vitest';
import { parseShadowCsv, readShadowList } from './shadow.js';
import { join } from 'node:path';

describe('parseShadowCsv', () => {
  it('parses basic entries correctly', () => {
    const csv = `dex_number,name,form,type1,type2
1,Bulbasaur,,Grass,Poison
4,Charmander,,Fire,`;
    const entries = parseShadowCsv(csv);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({
      dexNr: 1,
      name: 'Bulbasaur',
      form: '',
      type1: 'Grass',
      type2: 'Poison',
    });
  });

  it('handles empty form field', () => {
    const csv = `dex_number,name,form,type1,type2
6,Charizard,,Fire,Flying`;
    const entries = parseShadowCsv(csv);
    expect(entries[0].form).toBe('');
  });

  it('handles empty type2 field', () => {
    const csv = `dex_number,name,form,type1,type2
4,Charmander,,Fire,`;
    const entries = parseShadowCsv(csv);
    expect(entries[0].type2).toBe('');
  });

  it('handles special characters (Nidoran♀)', () => {
    const csv = `dex_number,name,form,type1,type2
29,Nidoran♀,,Poison,
32,Nidoran♂,,Poison,`;
    const entries = parseShadowCsv(csv);
    expect(entries[0].name).toBe('Nidoran♀');
    expect(entries[1].name).toBe('Nidoran♂');
  });

  it('skips header row', () => {
    const csv = `dex_number,name,form,type1,type2
1,Bulbasaur,,Grass,Poison`;
    const entries = parseShadowCsv(csv);
    expect(entries).toHaveLength(1);
    expect(entries[0].dexNr).toBe(1);
  });

  it('skips empty lines', () => {
    const csv = `dex_number,name,form,type1,type2
1,Bulbasaur,,Grass,Poison

4,Charmander,,Fire,

`;
    const entries = parseShadowCsv(csv);
    expect(entries).toHaveLength(2);
  });

  it('returns correct count from full CSV', async () => {
    const entries = await readShadowList(join(process.cwd(), 'shadow_pokemon.csv'));
    // CSV has 478 lines total, 1 header, some may be empty at end
    expect(entries.length).toBeGreaterThan(400);
    expect(entries.length).toBeLessThan(500);
  });
});
