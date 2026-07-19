import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

import { fetchPokedex } from "./fetcher.js";
import { transformAll } from "./transformer.js";
import { runPipeline } from "./calculators/index.js";
import { dpsCalculator } from "./calculators/dps.js";
import { writePokedex } from "./writer.js";

const HASH_FILE = join("data", "last-hash.txt");

function computeHash(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

async function readLastHash(): Promise<string | null> {
  try {
    return (await readFile(HASH_FILE, "utf-8")).trim();
  } catch {
    return null;
  }
}

async function saveHash(hash: string): Promise<void> {
  await mkdir("data", { recursive: true });
  await writeFile(HASH_FILE, hash, "utf-8");
}

function elapsed(start: number): string {
  return ((performance.now() - start) / 1000).toFixed(2) + "s";
}

async function main(): Promise<void> {
  const buildStart = performance.now();
  console.log("🔄 pogo-db-api build started");

  // Step 1: Fetch
  const fetchStart = performance.now();
  const rawData = await fetchPokedex();
  console.log(`📥 Fetched ${rawData.length} pokemon in ${elapsed(fetchStart)}`);

  // Step 2: Transform
  const transformStart = performance.now();
  const transformed = transformAll(rawData);
  console.log(`🔄 Transformed ${transformed.length} pokemon in ${elapsed(transformStart)}`);

  // Step 3: Compute (extensible calculator pipeline)
  const computeStart = performance.now();
  const calculators = [dpsCalculator];
  const computed = runPipeline(transformed, calculators);
  console.log(
    `🧮 Ran ${calculators.length} calculator(s) [${calculators.map((c) => c.name).join(", ")}] in ${elapsed(computeStart)}`
  );

  // Step 4: Change detection
  // In CI, always write since public/api/ doesn't persist between runs.
  // Change detection only prevents unnecessary deploys via the CACHE_STATUS output.
  const serialized = JSON.stringify(computed);
  const currentHash = computeHash(serialized);
  const lastHash = await readLastHash();
  const isCI = !!process.env.GITHUB_ACTIONS;

  if (!isCI && currentHash === lastHash) {
    console.log("✅ No changes detected — skipping write");
    console.log(`⏱️  Total: ${elapsed(buildStart)}`);
    return;
  }

  const hasChanges = currentHash !== lastHash;
  if (!hasChanges) {
    console.log("ℹ️  No data changes (but writing files for CI artifact)");
  } else {
    console.log("📝 Changes detected — writing files");
  }

  // Step 5: Write
  const writeStart = performance.now();
  const { filesWritten, index } = await writePokedex(computed);
  console.log(
    `💾 Wrote ${filesWritten} files (${index.length} pokemon) in ${elapsed(writeStart)}`
  );

  // Save hash for next run
  await saveHash(currentHash);

  console.log(`✅ Build complete in ${elapsed(buildStart)}`);
  console.log("::set-output name=CACHE_STATUS::HAS_CHANGES");
}

main().catch((error) => {
  console.error("❌ Build failed:", error);
  process.exit(1);
});
