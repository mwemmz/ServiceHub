/**
 * Builds full-screen category states from the reference mockup.
 * Exports at 2× (1322×2048) for retina / HD displays.
 * Run: node scripts/build-category-screen-states.mjs
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'assets', 'images', 'reference-category');
const sourceFile =
  'C:/Users/Liah/.cursor/projects/c-Users-Liah-Desktop-ServiceHub/assets/c__Users_Liah_AppData_Roaming_Cursor_User_workspaceStorage_7b48114e77a32722d6d31acf7a0ebf40_images_ChatGPT_Image_Sep_1__2026__03_45_00_PM-e1a504b1-f490-4121-8fc6-77695a76e794.jpg';
const refPath = join(outDir, 'source.jpg');

const SCALE = 2;
const s = (n) => Math.round(n * SCALE);

const CANVAS = { width: s(661), height: s(1024) };
const PANEL = { left: s(44), top: s(56), width: s(573), height: s(944) };
const CARD_W = s(549);
const CARD_H = s(174);
const CARD_LEFT = s(12);
const CARDS = [
  { key: 'beauty', top: s(148) },
  { key: 'repair', top: s(336) },
  { key: 'cleaning', top: s(524) },
];

mkdirSync(outDir, { recursive: true });
copyFileSync(sourceFile, refPath);

async function cropRef(region, outName) {
  const scaled = {
    left: s(region.left),
    top: s(region.top),
    width: s(region.width),
    height: s(region.height),
  };
  const out = join(outDir, outName);
  await sharp(refPath)
    .resize(CANVAS.width, CANVAS.height, { fit: 'fill' })
    .extract(scaled)
    .png({ compressionLevel: 6 })
    .toFile(out);
  const meta = await sharp(out).metadata();
  console.log(`${outName} -> ${meta.width}x${meta.height}`);
}

async function cardBuffer(fileName) {
  return sharp(join(outDir, fileName)).resize(CARD_W, CARD_H, { fit: 'fill' }).png().toBuffer();
}

async function loadRaw(fileName) {
  return sharp(join(outDir, fileName))
    .resize(CARD_W, CARD_H)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

/** Pixels that differ between idle and selected cards (border glow, checkmark, etc.). */
async function makeSelectionOverlay(idleName, selectedName) {
  const selected = await loadRaw(selectedName);
  const idle = await loadRaw(idleName);
  const w = selected.info.width;
  const h = selected.info.height;
  const out = Buffer.alloc(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const dr = Math.abs(selected.data[i] - idle.data[i]);
      const dg = Math.abs(selected.data[i + 1] - idle.data[i + 1]);
      const db = Math.abs(selected.data[i + 2] - idle.data[i + 2]);
      const da = Math.abs(selected.data[i + 3] - idle.data[i + 3]);
      const diff = dr + dg + db + da * 2;

      if (diff > 36) {
        out[i] = selected.data[i];
        out[i + 1] = selected.data[i + 1];
        out[i + 2] = selected.data[i + 2];
        out[i + 3] = selected.data[i + 3];
      }
    }
  }

  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile(join(outDir, 'selection-overlay.png'));
}

/**
 * Beauty unselected: repair idle chrome (thin border + empty radio) with beauty artwork
 * pasted into the interior. Avoids pasting repair pixels onto the red card (seam bug).
 */
async function makeBeautyIdle() {
  const w = CARD_W;
  const h = CARD_H;
  const [selected, repair] = await Promise.all([
    loadRaw('card-beauty-selected.png'),
    loadRaw('card-repair-idle.png'),
  ]);

  const out = Buffer.from(repair.data);
  const border = s(22);
  const radioCx = w - s(32);
  const radioCy = s(32);
  const radioR = s(36);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const onBorder = x < border || x >= w - border || y < border || y >= h - border;
      const inRadio =
        (x - radioCx) * (x - radioCx) + (y - radioCy) * (y - radioCy) <= radioR * radioR;

      if (!onBorder && !inRadio) {
        out[i] = selected.data[i];
        out[i + 1] = selected.data[i + 1];
        out[i + 2] = selected.data[i + 2];
        out[i + 3] = selected.data[i + 3];
      }
    }
  }

  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 6 })
    .toFile(join(outDir, 'card-beauty-idle.png'));
  console.log('card-beauty-idle.png');
}

async function makeSelectedCard(idleName, outName) {
  const overlay = await sharp(join(outDir, 'selection-overlay.png')).resize(CARD_W, CARD_H).toBuffer();
  await sharp(join(outDir, idleName))
    .resize(CARD_W, CARD_H)
    .composite([{ input: overlay, blend: 'over' }])
    .png({ compressionLevel: 6 })
    .toFile(join(outDir, outName));
  console.log(outName);
}

async function composeFullScreen(stateName, replacements) {
  const composites = await Promise.all(
    replacements.map(async ({ index, file }) => ({
      input: await cardBuffer(file),
      left: PANEL.left + CARD_LEFT,
      top: PANEL.top + CARDS[index].top,
    })),
  );

  await sharp(refPath)
    .resize(CANVAS.width, CANVAS.height, { fit: 'fill' })
    .composite(composites)
    .png({ compressionLevel: 6 })
    .toFile(join(outDir, stateName));
  console.log(`${stateName} (${CANVAS.width}x${CANVAS.height})`);
}

await cropRef(
  { left: 44 + 12, top: 56 + 148, width: 549, height: 174 },
  'card-beauty-selected.png',
);
await cropRef(
  { left: 44 + 12, top: 56 + 336, width: 549, height: 174 },
  'card-repair-idle.png',
);
await cropRef(
  { left: 44 + 12, top: 56 + 524, width: 549, height: 174 },
  'card-cleaning-idle.png',
);

await makeBeautyIdle();
await makeSelectionOverlay('card-beauty-idle.png', 'card-beauty-selected.png');
await makeSelectedCard('card-repair-idle.png', 'card-repair-selected.png');
await makeSelectedCard('card-cleaning-idle.png', 'card-cleaning-selected.png');

await sharp(refPath)
  .resize(CANVAS.width, CANVAS.height, { fit: 'fill' })
  .png({ compressionLevel: 6 })
  .toFile(join(outDir, 'full-beauty.png'));
console.log(`full-beauty.png (${CANVAS.width}x${CANVAS.height})`);

await composeFullScreen('full-repair.png', [
  { index: 0, file: 'card-beauty-idle.png' },
  { index: 1, file: 'card-repair-selected.png' },
]);
await composeFullScreen('full-cleaning.png', [
  { index: 0, file: 'card-beauty-idle.png' },
  { index: 2, file: 'card-cleaning-selected.png' },
]);
await composeFullScreen('full-none.png', [
  { index: 0, file: 'card-beauty-idle.png' },
  { index: 1, file: 'card-repair-idle.png' },
  { index: 2, file: 'card-cleaning-idle.png' },
]);

console.log('done — HD full-screen PNGs ready');
