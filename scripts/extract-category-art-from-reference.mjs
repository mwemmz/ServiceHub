/**
 * Crops category artwork regions from the reference mockup (661×1024).
 * Run: node scripts/extract-category-art-from-reference.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const refPath =
  'C:/Users/Liah/.cursor/projects/c-Users-Liah-Desktop-ServiceHub/assets/c__Users_Liah_AppData_Roaming_Cursor_User_workspaceStorage_7b48114e77a32722d6d31acf7a0ebf40_images_ChatGPT_Image_Sep_1__2026__03_45_00_PM-cfbc6390-dc90-495f-b643-9f8e4bb40a40.jpg';
const outDir = join(__dirname, '..', 'assets', 'images', 'services');

/** Right-side art clusters per card — tuned to 661×1024 reference. */
const crops = [
  { name: 'category-beauty.png', left: 318, top: 248, width: 300, height: 200 },
  { name: 'category-repair.png', left: 318, top: 448, width: 300, height: 200 },
  { name: 'category-cleaning.png', left: 318, top: 648, width: 300, height: 200 },
];

function lum(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function alphaForPixel(r, g, b, category) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = lum(r, g, b);
  const chroma = max - min;

  // Category-tinted card backgrounds to key out
  if (category === 'beauty') {
    if (r > g && r > b && r > 80 && g < r * 0.75 && b < r * 0.7 && l < 200) {
      const strength = Math.min(1, (r - 70) / 90);
      return Math.round((1 - strength) * 255);
    }
  }
  if (category === 'repair') {
    if (b >= g && b > r && l > 40 && l < 180 && chroma < 60) {
      const strength = Math.min(1, (b - 35) / 80);
      return Math.round((1 - strength) * 255);
    }
  }
  if (category === 'cleaning') {
    if (g > r && g > b && g > 50 && l < 200) {
      const strength = Math.min(1, (g - 45) / 90);
      return Math.round((1 - strength) * 255);
    }
  }

  if (max < 35) return 0;
  if (l < 42 && max < 55) return 0;
  return 255;
}

function floodClear(data, width, height, isBg) {
  const visited = new Uint8Array(width * height);
  const queue = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const o = idx * 4;
    if (!isBg(data[o], data[o + 1], data[o + 2])) return;
    visited[idx] = 1;
    queue.push(idx);
  };
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }
  while (queue.length) {
    const idx = queue.pop();
    data[idx * 4 + 3] = 0;
    const x = idx % width;
    const y = (idx - x) / width;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
}

async function processCrop({ name, left, top, width, height }) {
  const category = name.includes('beauty') ? 'beauty' : name.includes('repair') ? 'repair' : 'cleaning';
  const cropped = await sharp(refPath).extract({ left, top, width, height }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = cropped;

  for (let i = 0; i < data.length; i += 4) {
    data[i + 3] = alphaForPixel(data[i], data[i + 1], data[i + 2], category);
  }

  const isBg = (r, g, b) => alphaForPixel(r, g, b, category) < 40;
  floodClear(data, info.width, info.height, isBg);

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 20) data[i + 3] = 0;
  }

  const out = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 12 })
    .extend({ top: 2, bottom: 0, left: 2, right: 2, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  writeFileSync(join(outDir, name), out);
  const meta = await sharp(out).metadata();
  console.log(`${name} -> ${meta.width}x${meta.height}`);
}

for (const crop of crops) {
  await processCrop(crop);
}

console.log('Reference art extracted.');
