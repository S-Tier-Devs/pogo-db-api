import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writePokedex } from "./writer.js";
import { mkdtemp, rm, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Pokemon } from "./types.js";

function makePokemonFixture(overrides: Partial<Pokemon> = {}): Pokemon {
  return {
    id: "BULBASAUR",
    formId: "BULBASAUR",
    dexNr: 1,
    generation: 1,
    name: "Bulbasaur",
    stats: { stamina: 128, attack: 118, defense: 111 },
    primaryType: { type: "POKEMON_TYPE_GRASS", name: "Grass" },
    secondaryType: { type: "POKEMON_TYPE_POISON", name: "Poison" },
    pokemonClass: null,
    quickMoves: [],
    cinematicMoves: [],
    eliteQuickMoves: [],
    eliteCinematicMoves: [],
    assets: null,
    evolutions: [],
    hasMegaEvolution: false,
    megaEvolutions: [],
    computed: null,
    ...overrides,
  };
}

describe("writePokedex", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "pogo-db-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("creates output directory and writes individual JSON files", async () => {
    const outputDir = join(tempDir, "api/pokemon");
    const pokemon = [
      makePokemonFixture({ dexNr: 1, name: "Bulbasaur" }),
      makePokemonFixture({ dexNr: 25, id: "PIKACHU", formId: "PIKACHU", name: "Pikachu" }),
    ];

    const { filesWritten } = await writePokedex(pokemon, outputDir);

    expect(filesWritten).toBe(3); // 2 pokemon + 1 index
    const files = await readdir(outputDir);
    expect(files.sort()).toEqual(["1.json", "25.json", "index.json"]);
  });

  it("writes correct JSON content for a pokemon", async () => {
    const outputDir = join(tempDir, "api/pokemon");
    const pokemon = [makePokemonFixture({ dexNr: 1, name: "Bulbasaur" })];

    await writePokedex(pokemon, outputDir);

    const content = JSON.parse(await readFile(join(outputDir, "1.json"), "utf-8"));
    expect(content.name).toBe("Bulbasaur");
    expect(content.dexNr).toBe(1);
    expect(content.stats).toEqual({ stamina: 128, attack: 118, defense: 111 });
  });

  it("groups multiple forms under the same dexNr", async () => {
    const outputDir = join(tempDir, "api/pokemon");
    const pokemon = [
      makePokemonFixture({ dexNr: 25, id: "PIKACHU", name: "Pikachu" }),
      makePokemonFixture({ dexNr: 25, id: "PIKACHU_LIBRE", formId: "PIKACHU_LIBRE", name: "Pikachu" }),
    ];

    await writePokedex(pokemon, outputDir);

    const content = JSON.parse(await readFile(join(outputDir, "25.json"), "utf-8"));
    expect(content.id).toBe("PIKACHU");
    expect(content.forms).toHaveLength(1);
    expect(content.forms[0].id).toBe("PIKACHU_LIBRE");
  });

  it("writes a correct index.json manifest", async () => {
    const outputDir = join(tempDir, "api/pokemon");
    const pokemon = [
      makePokemonFixture({ dexNr: 25, id: "PIKACHU", name: "Pikachu" }),
      makePokemonFixture({ dexNr: 1, id: "BULBASAUR", name: "Bulbasaur" }),
    ];

    const { index } = await writePokedex(pokemon, outputDir);

    // Should be sorted by dexNr
    expect(index[0]).toEqual({ dexNr: 1, name: "Bulbasaur", id: "BULBASAUR" });
    expect(index[1]).toEqual({ dexNr: 25, name: "Pikachu", id: "PIKACHU" });

    // Verify file on disk matches
    const fileContent = JSON.parse(await readFile(join(outputDir, "index.json"), "utf-8"));
    expect(fileContent).toEqual(index);
  });

  it("pretty-prints JSON with 2-space indent", async () => {
    const outputDir = join(tempDir, "api/pokemon");
    const pokemon = [makePokemonFixture({ dexNr: 1 })];

    await writePokedex(pokemon, outputDir);

    const raw = await readFile(join(outputDir, "1.json"), "utf-8");
    // Should start with {\n  " (2-space indent)
    expect(raw).toMatch(/^\{\n {2}"/);
  });
});
