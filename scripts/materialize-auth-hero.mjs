import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(repoRoot, "assets", "auth", "cortex-auth-hero.b64");
const outputDir = path.join(repoRoot, "public");
const outputPath = path.join(outputDir, "cortex-auth-hero.webp");

const encoded = (await readFile(sourcePath, "utf8")).trim();
const bytes = Buffer.from(encoded, "base64");
if (bytes.length < 10_000 || bytes.subarray(0, 4).toString("ascii") !== "RIFF" || bytes.subarray(8, 12).toString("ascii") !== "WEBP") {
  throw new Error("Invalid Cortex auth hero asset");
}

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, bytes);
console.log(`[auth-art] materialized ${path.relative(repoRoot, outputPath)} (${bytes.length} bytes)`);
