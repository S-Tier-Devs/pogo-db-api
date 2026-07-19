import type { Calculator } from "./index.js";
import type { Pokemon, Move } from "../types.js";

const STAB_MULTIPLIER = 1.2;

function computeMoveDps(move: Move, pokemon: Pokemon): Move {
  const durationSeconds = move.durationMs / 1000;
  const dps = durationSeconds > 0 ? move.power / durationSeconds : 0;

  const isStab =
    move.type.type === pokemon.primaryType.type ||
    move.type.type === pokemon.secondaryType?.type;

  const stabDps = isStab ? dps * STAB_MULTIPLIER : dps;

  return {
    ...move,
    computed: {
      ...move.computed,
      dps: Math.round(dps * 100) / 100,
      stabDps: Math.round(stabDps * 100) / 100,
    },
  };
}

function computeMovesForPokemon(moves: Move[], pokemon: Pokemon): Move[] {
  return moves.map((move) => computeMoveDps(move, pokemon));
}

export const dpsCalculator: Calculator = {
  name: "dps",
  compute(pokemon: Pokemon): Pokemon {
    return {
      ...pokemon,
      quickMoves: computeMovesForPokemon(pokemon.quickMoves, pokemon),
      cinematicMoves: computeMovesForPokemon(pokemon.cinematicMoves, pokemon),
      eliteQuickMoves: computeMovesForPokemon(pokemon.eliteQuickMoves, pokemon),
      eliteCinematicMoves: computeMovesForPokemon(pokemon.eliteCinematicMoves, pokemon),
    };
  },
};
