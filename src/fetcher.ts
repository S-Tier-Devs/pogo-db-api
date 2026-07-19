import type { RawUpstreamPokemon } from "./types.js";

const UPSTREAM_URL =
  "https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex.json";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchPokedex(): Promise<RawUpstreamPokemon[]> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(UPSTREAM_URL);

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = (await response.json()) as RawUpstreamPokemon[];

      if (!Array.isArray(data)) {
        throw new Error("Expected array response from upstream API");
      }

      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `Fetch attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.message}`
      );

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  throw new Error(
    `Failed to fetch pokedex after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}
