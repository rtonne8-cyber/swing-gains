import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const iconSvgPath = path.join(root, "assets", "icon.svg");
const publicDir = path.join(root, "public");

const iconSvg = readFileSync(iconSvgPath);

async function renderIcon(size, outName) {
  await sharp(iconSvg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(publicDir, outName));
  console.log(`wrote ${outName} (${size}x${size})`);
}

async function main() {
  mkdirSync(publicDir, { recursive: true });
  await renderIcon(512, "icon-512.png");
  await renderIcon(512, "icon-maskable-512.png");
  await renderIcon(192, "icon-192.png");
  await renderIcon(180, "apple-touch-icon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
