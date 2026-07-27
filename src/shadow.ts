import { readFile } from 'node:fs/promises';

export interface ShadowEntry {
  dexNr: number;
  name: string;
  form: string;
  type1: string;
  type2: string;
}

const CSV_PATH = 'shadow_pokemon.csv';

/**
 * Parses shadow CSV content into structured entries.
 * Handles: header skip, empty form/type2 fields, special chars, empty lines.
 */
export function parseShadowCsv(content: string): ShadowEntry[] {
  const lines = content.split('\n');
  const entries: ShadowEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    const parts = line.split(',');
    if (parts.length < 4) continue;

    const dexNr = parseInt(parts[0].trim(), 10);
    if (isNaN(dexNr)) continue;

    entries.push({
      dexNr,
      name: parts[1].trim(),
      form: parts[2].trim(),
      type1: parts[3].trim(),
      type2: (parts[4] ?? '').trim(),
    });
  }

  return entries;
}

/**
 * Reads and parses the shadow Pokemon CSV file.
 */
export async function readShadowList(csvPath: string = CSV_PATH): Promise<ShadowEntry[]> {
  const content = await readFile(csvPath, 'utf-8');
  return parseShadowCsv(content);
}
