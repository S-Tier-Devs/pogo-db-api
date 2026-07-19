import type { Pokemon } from "../types.js";

/**
 * A Calculator takes a Pokemon and returns a new Pokemon with computed fields added.
 * Implement this interface to add new computations to the build pipeline.
 */
export interface Calculator {
  name: string;
  compute(pokemon: Pokemon): Pokemon;
}

/**
 * Runs all calculators in sequence on each Pokemon.
 * Add new calculators to the array to extend the pipeline.
 */
export function runPipeline(
  pokemon: Pokemon[],
  calculators: Calculator[]
): Pokemon[] {
  return pokemon.map((p) =>
    calculators.reduce((current, calc) => calc.compute(current), p)
  );
}
