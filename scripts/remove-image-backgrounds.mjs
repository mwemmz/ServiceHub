/**
 * Removes backgrounds from category artwork PNGs and trims to content bounds.
 * Run: node scripts/remove-image-backgrounds.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'assets', 'images', 'services');
const files = ['category-beauty.png', 'category-repair.png', 'category-cleaning.png'];

function lum(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isBackground(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = lum(r, g, b);
  const chroma = max - min;

  // Pure black / near-black studio backdrop
  if (max < 42) return true;
  if (l < 50 && max < 62) return true;

  // White / off-white
  if (min > 232 && l > 238) return true;
  if (min > 205 && l > 222 && chroma < 24) return true;

  // Checkerboard greys (common in generated PNGs)
  if (chroma < 18 && l > 108 && l < 252) return true;

  return false;
}

function alphaForPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = lum(r, g, b);
  const chroma = max - min;

  if (max < 42) return 0;
  if (l < 50 && max < 62) return 0;
  if (max < 78) return Math.round(((max - 42) / 36) * 255);

  if (min > 232) return 0;
  if (min > 198 && l > 215 && chroma < 28) {
    return Math.round(((248 - min) / 50) * 255);
  }

  // Soft grey checkerboard fringe
  if (chroma < 18 && l > 108 && l < 252) {
    const dist = Math.min(Math.abs(l - 192), Math.abs(l - 224), Math.abs(l - 255));
    return Math.round((dist / 48) * 255);
  }

  return 255;
}

function cleanupAlpha(data) {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 18) data[i + 3] = 0;
    else if (data[i + 3] < 120) data[i + 3] = Math.round((data[i + 3] / 120) * 255);
  }
}

function floodClearBackground(data, width, height) {
  const visited = new Uint8Array(width * height);
  const queue = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const o = idx * 4;
    if (!isBackground(data[o], data[o + 1], data[o + 2])) return;
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
    const o = idx * 4;
    data[o + 3] = 0;
    const x = idx % width;
    const y = (idx - x) / width;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
}

async function processFile(name) {
  const input = join(assetsDir, name);
  const original = readFileSync(input);
  const { data, info } = await sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    data[i + 3] = alphaForPixel(data[i], data[i + 1], data[i + 2]);
  }

  floodClearBackground(data, info.width, info.height);
  cleanupAlpha(data);

  const trimmed = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 10 })
    .extend({
      top: 4,
      bottom: 0,
      left: 4,
      right: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  writeFileSync(input, trimmed);
  const meta = await sharp(trimmed).metadata();
  console.log(`Processed ${name} -> ${meta.width}x${meta.height}`);
}

for (const file of files) {
  await processFile(file);
}

console.log('Done — transparent artwork ready.');
