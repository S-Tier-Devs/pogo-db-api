import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Pokemon } from "./types.js";

const OUTPUT_DIR = "public/api/pokemon";

export interface IndexEntry {
  dexNr: number;
  name: string;
  id: string;
}

/** A variant entry in the API output */
export interface VariantOutput {
  variant: "shadow" | "mega";
  variantName: string;
  id: string;
  formId: string;
  name: string;
  stats: Pokemon["stats"];
  primaryType: Pokemon["primaryType"];
  secondaryType: Pokemon["secondaryType"];
  assets: Pokemon["assets"];
  computed: Pokemon["computed"];
}

/**
 * Groups Pokemon by dexNr, separating base forms from variants.
 */
function groupByDexNr(
  pokemon: Pokemon[]
): Map<number, { bases: Pokemon[]; variants: Pokemon[] }> {
  const groups = new Map<number, { bases: Pokemon[]; variants: Pokemon[] }>();

  for (const p of pokemon) {
    const existing = groups.get(p.dexNr) ?? { bases: [], variants: [] };
    if (p.variant) {
      existing.variants.push(p);
    } else {
      existing.bases.push(p);
    }
    groups.set(p.dexNr, existing);
  }

  return groups;
}

/**
 * Converts a variant Pokemon into the slim variant output shape.
 */
function toVariantOutput(p: Pokemon): VariantOutput {
  return {
    variant: p.variant!,
    variantName: p.variantName!,
    id: p.id,
    formId: p.formId,
    name: p.name,
    stats: p.stats,
    primaryType: p.primaryType,
    secondaryType: p.secondaryType,
    assets: p.assets,
    computed: p.computed,
  };
}

export async function writePokedex(
  pokemon: Pokemon[],
  outputDir: string = OUTPUT_DIR
): Promise<{ filesWritten: number; index: IndexEntry[] }> {
  await mkdir(outputDir, { recursive: true });

  const groups = groupByDexNr(pokemon);
  const index: IndexEntry[] = [];
  let filesWritten = 0;

  for (const [dexNr, { bases, variants }] of groups) {
    // Build the output content from base forms
    let content: unknown;
    if (bases.length === 1) {
      content = variants.length > 0
        ? { ...bases[0], variants: variants.map(toVariantOutput) }
        : bases[0];
    } else {
      content = variants.length > 0
        ? { ...bases[0], forms: bases.slice(1), variants: variants.map(toVariantOutput) }
        : { ...bases[0], forms: bases.slice(1) };
    }

    const filePath = join(outputDir, `${dexNr}.json`);
    await writeFile(filePath, JSON.stringify(content, null, 2), "utf-8");
    filesWritten++;

    index.push({
      dexNr,
      name: bases[0].name,
      id: bases[0].id,
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
