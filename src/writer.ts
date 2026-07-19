import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Pokemon } from "./types.js";

const OUTPUT_DIR = "public/api/pokemon";

export interface IndexEntry {
  dexNr: number;
  name: string;
  id: string;
}

/**
 * Groups Pokemon by dexNr. If multiple forms share the same dexNr,
 * the base form (where id matches the first entry) is used as the primary,
 * and all entries for that dexNr are included in the file.
 */
function groupByDexNr(pokemon: Pokemon[]): Map<number, Pokemon[]> {
  const groups = new Map<number, Pokemon[]>();

  for (const p of pokemon) {
    const existing = groups.get(p.dexNr) ?? [];
    existing.push(p);
    groups.set(p.dexNr, existing);
  }

  return groups;
}

export async function writePokedex(
  pokemon: Pokemon[],
  outputDir: string = OUTPUT_DIR
): Promise<{ filesWritten: number; index: IndexEntry[] }> {
  await mkdir(outputDir, { recursive: true });

  const groups = groupByDexNr(pokemon);
  const index: IndexEntry[] = [];
  let filesWritten = 0;

  for (const [dexNr, forms] of groups) {
    const content =
      forms.length === 1
        ? forms[0]
        : { ...forms[0], forms: forms.slice(1) };

    const filePath = join(outputDir, `${dexNr}.json`);
    await writeFile(filePath, JSON.stringify(content, null, 2), "utf-8");
    filesWritten++;

    index.push({
      dexNr,
      name: forms[0].name,
      id: forms[0].id,
    });
  }

  // Sort index by dexNr
  index.sort((a, b) => a.dexNr - b.dexNr);

  // Write index manifest
  const indexPath = join(outputDir, "index.json");
  await writeFile(indexPath, JSON.stringify(index, null, 2), "utf-8");
  filesWritten++;

  return { filesWritten, index };
}
