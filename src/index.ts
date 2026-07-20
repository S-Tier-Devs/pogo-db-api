import { readPokedex } from "./reader.js";
import { runPipeline } from "./calculators/index.js";
import { dpsCalculator } from "./calculators/dps.js";
import { writePokedex } from "./writer.js";

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

  // Step 2: Compute (extensible calculator pipeline)
  const computeStart = performance.now();
  const calculators = [dpsCalculator];
  const computed = runPipeline(pokemon, calculators);
  console.log(
    `🧮 Ran ${calculators.length} calculator(s) [${calculators.map((c) => c.name).join(", ")}] in ${elapsed(computeStart)}`
  );

  // Step 3: Write API output
  const writeStart = performance.now();
  const { filesWritten, index } = await writePokedex(computed);
  console.log(
    `💾 Wrote ${filesWritten} files (${index.length} pokemon) in ${elapsed(writeStart)}`
  );

  console.log(`✅ Build complete in ${elapsed(buildStart)}`);
}

main().catch((error) => {
  console.error("❌ Build failed:", error);
  process.exit(1);
});
