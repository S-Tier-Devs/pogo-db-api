import { readPokedex } from "./reader.js";
import { runPipeline } from "./calculators/index.js";
import { dpsCalculator } from "./calculators/dps.js";
import { tdoCalculator } from "./calculators/tdo.js";
import { writePokedex } from "./writer.js";
import { writeRankings } from "./rankings-writer.js";
import { writeRaids } from "./raids-writer.js";
import { writeEvents } from "./events-writer.js";
import { readShadowList } from "./shadow.js";
import { expandVariants } from "./expander.js";

function elapsed(start: number): string {
  return ((performance.now() - start) / 1000).toFixed(2) + "s";
}

async function main(): Promise<void> {
  const buildStart = performance.now();
  console.log("🔄 pogo-db-api build started");

  // Step 1: Read stored data
  const readStart = performance.now();
  const pokemon = await readPokedex();
  console.log(`📖 Read ${pokemon.length} pokemon from data/ in ${elapsed(readStart)}`);

  // Step 2: Load shadow list and expand variants
  const expandStart = performance.now();
  const shadowList = await readShadowList();
  const expanded = expandVariants(pokemon, shadowList);
  const shadowCount = expanded.filter((p) => p.variant === "shadow").length;
  const megaCount = expanded.filter((p) => p.variant === "mega").length;
  console.log(
    `🔀 Expanded to ${expanded.length} entries (+${shadowCount} shadow, +${megaCount} mega) in ${elapsed(expandStart)}`
  );

  // Step 3: Compute (extensible calculator pipeline)
  const computeStart = performance.now();
  const calculators = [dpsCalculator, tdoCalculator];
  const computed = runPipeline(expanded, calculators);
  console.log(
    `🧮 Ran ${calculators.length} calculator(s) [${calculators.map((c) => c.name).join(", ")}] in ${elapsed(computeStart)}`
  );

  // Step 4: Write API output
  const writeStart = performance.now();
  const { filesWritten, index } = await writePokedex(computed);
  console.log(
    `💾 Wrote ${filesWritten} files (${index.length} pokemon) in ${elapsed(writeStart)}`
  );

  // Step 5: Write type rankings
  const rankingsStart = performance.now();
  const rankingsWritten = await writeRankings(computed);
  console.log(
    `🏆 Wrote ${rankingsWritten} ranking files in ${elapsed(rankingsStart)}`
  );

  // Step 6: Fetch and write current raid bosses
  const raidsStart = performance.now();
  const raidsWritten = await writeRaids();
  if (raidsWritten) {
    console.log(`🥊 Wrote raid bosses in ${elapsed(raidsStart)}`);
  } else {
    console.log(`🥊 Skipped raid bosses (fetch unavailable) in ${elapsed(raidsStart)}`);
  }

  // Step 7: Fetch and write current events
  const eventsStart = performance.now();
  const eventsWritten = await writeEvents();
  if (eventsWritten) {
    console.log(`📅 Wrote events in ${elapsed(eventsStart)}`);
  } else {
    console.log(`📅 Skipped events (fetch unavailable) in ${elapsed(eventsStart)}`);
  }

  console.log(`✅ Build complete in ${elapsed(buildStart)}`);
}

main().catch((error) => {
  console.error("❌ Build failed:", error);
  process.exit(1);
});
