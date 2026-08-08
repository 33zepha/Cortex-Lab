import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(repoRoot, "assets", "auth");
const outputDir = path.join(repoRoot, "public");

const sourcePaths = [0, 1, 2].map((index) => path.join(sourceDir, `cortex-auth-hero.part${index}.b64`));
const parts = await Promise.all(sourcePaths.map((sourcePath) => readFile(sourcePath, "utf8")));
const encoded = parts.map((part) => part.trim()).join("");
const bytes = Buffer.from(encoded, "base64");

if (
  bytes.length < 40_000 ||
  bytes.subarray(0, 4).toString("ascii") !== "RIFF" ||
  bytes.subarray(8, 12).toString("ascii") !== "WEBP"
) {
  throw new Error("Invalid Cortex auth hero asset header");
}

const metadata = await sharp(bytes).metadata();
if (metadata.format !== "webp" || metadata.width !== 1024 || metadata.height !== 576) {
  throw new Error(`Invalid Cortex auth hero payload: ${metadata.format} ${metadata.width}x${metadata.height}`);
}

await mkdir(outputDir, { recursive: true });

const derivatives = [
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
  { width: 3840, height: 2160 },
];

for (const { width, height } of derivatives) {
  const outputPath = path.join(outputDir, `cortex-auth-hero-${width}.webp`);
  const image = await sharp(bytes)
    .resize(width, height, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: false,
    })
    .sharpen({ sigma: 1.05 })
    .webp({
      quality: 95,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer();

  const outputMetadata = await sharp(image).metadata();
  if (outputMetadata.format !== "webp" || outputMetadata.width !== width || outputMetadata.height !== height) {
    throw new Error(`Invalid generated Cortex auth hero: ${outputMetadata.format} ${outputMetadata.width}x${outputMetadata.height}`);
  }

  await writeFile(outputPath, image);
  console.log(`[auth-art] materialized ${path.relative(repoRoot, outputPath)} (${width}x${height}, ${image.length} bytes)`);
}
