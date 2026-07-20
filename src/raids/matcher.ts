/** An entry from the Pokemon index (public/api/pokemon/index.json) */
export interface PokemonIndexEntry {
  dexNr: number;
  name: string;
  id: string;
}

/** Known prefixes that indicate form variants */
const FORM_PREFIXES = [
  "Shadow",
  "Mega",
  "Alolan",
  "Galarian",
  "Hisuian",
  "Paldean",
];

/**
 * Patterns that indicate costume/event suffixes.
 * These are stripped from the name to find the base Pokémon.
 */
const COSTUME_PATTERNS = [
  /\s+with\s+.+$/i,
  /\s+wearing\s+.+$/i,
  /\s+holding\s+.+$/i,
  /\s+dressed\s+.+$/i,
];

/**
 * Creates a name matcher that resolves display names to dexNr.
 *
 * Matching strategy (best-effort):
 * 1. Strip known form prefixes (Shadow, Mega, Alolan, etc.)
 * 2. Strip costume suffixes (with X, wearing Y, etc.)
 * 3. Case-insensitive lookup against the Pokémon index
 *
 * Returns dexNr or null if no match found.
 */
export function createMatcher(
  index: PokemonIndexEntry[]
): (displayName: string) => number | null {
  // Build a case-insensitive lookup map
  const nameMap = new Map<string, number>();
  for (const entry of index) {
    nameMap.set(entry.name.toLowerCase(), entry.dexNr);
  }

  return (displayName: string): number | null => {
    // First try exact match (handles names like "Kyogre" directly)
    const exactKey = displayName.toLowerCase().trim();
    if (nameMap.has(exactKey)) {
      return nameMap.get(exactKey)!;
    }

    // Strip known form prefixes
    let stripped = displayName.trim();
    for (const prefix of FORM_PREFIXES) {
      const re = new RegExp(`^${prefix}\\s+`, "i");
      stripped = stripped.replace(re, "");
    }

    // Try after prefix stripping
    if (nameMap.has(stripped.toLowerCase())) {
      return nameMap.get(stripped.toLowerCase())!;
    }

    // Strip costume suffixes
    let withoutCostume = stripped;
    for (const pattern of COSTUME_PATTERNS) {
      withoutCostume = withoutCostume.replace(pattern, "");
    }

    if (nameMap.has(withoutCostume.toLowerCase())) {
      return nameMap.get(withoutCostume.toLowerCase())!;
    }

    // Try stripping event prefixes like "Formal", "World Championships 2022", etc.
    // These are names like "Formal Pikachu" or "Amethyst Crown Pikachu"
    // Last-resort: check if any Pokémon name is a substring at the end
    for (const entry of index) {
      const entryName = entry.name.toLowerCase();
      const target = withoutCostume.toLowerCase();
      if (target.endsWith(entryName)) {
        return entry.dexNr;
      }
    }

    return null;
  };
}
