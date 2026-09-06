/**
 * Slices the service-category reference mockup (661×1024) into production assets.
 * Run: node scripts/extract-reference-category-assets.mjs
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const refPath =
  'C:/Users/Liah/.cursor/projects/c-Users-Liah-Desktop-ServiceHub/assets/c__Users_Liah_AppData_Roaming_Cursor_User_workspaceStorage_7b48114e77a32722d6d31acf7a0ebf40_images_ChatGPT_Image_Sep_1__2026__03_45_00_PM-cfbc6390-dc90-495f-b643-9f8e4bb40a40.jpg';
const outDir = join(__dirname, '..', 'assets', 'images', 'reference-category');

mkdirSync(outDir, { recursive: true });

/** Measured on 661×1024 reference — panel inner content. */
const W = 565;
const LEFT = 48;
const REGIONS = {
  panelHeader: { left: LEFT, top: 72, width: W, height: 122 },
  cardBeautySelected: { left: LEFT, top: 204, width: W, height: 180 },
  cardRepairIdle: { left: LEFT, top: 396, width: W, height: 180 },
  cardCleaningIdle: { left: LEFT, top: 588, width: W, height: 180 },
  continueButton: { left: LEFT, top: 792, width: W, height: 58 },
  panelGlass: { left: 40, top: 58, width: 581, height: 810 },
};

async function crop(name, region) {
  const out = join(outDir, `${name}.png`);
  await sharp(refPath).extract(region).png({ compressionLevel: 9 }).toFile(out);
  const meta = await sharp(out).metadata();
  console.log(`${name}.png -> ${meta.width}x${meta.height}`);
}

async function makeBeautyIdle() {
  const sel = REGIONS.cardBeautySelected;
  const inset = 3;
  await sharp(refPath)
    .extract({
      left: sel.left + inset,
      top: sel.top + inset,
      width: sel.width - inset * 2,
      height: sel.height - inset * 2,
    })
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, 'cardBeautyIdle.png'));
  console.log('cardBeautyIdle.png');
}

/** Selection glow frame extracted from beauty selected card edges. */
async function makeSelectionOverlay() {
  const selPath = join(outDir, 'cardBeautySelected.png');
  const idlePath = join(outDir, 'cardBeautyIdle.png');
  const sel = await sharp(selPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const idle = await sharp(idlePath)
    .resize(REGIONS.cardBeautySelected.width - 6, REGIONS.cardBeautySelected.height - 6)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.from(sel.data);
  const sw = sel.info.width;
  const sh = sel.info.height;
  const iw = idle.info.width;
  const ih = idle.info.height;
  const ox = Math.floor((sw - iw) / 2);
  const oy = Math.floor((sh - ih) / 2);

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const si = (y * sw + x) * 4;
      const ix = x - ox;
      const iy = y - oy;
      if (ix >= 0 && ix < iw && iy >= 0 && iy < ih) {
        const ii = (iy * iw + ix) * 4;
        if (idle.data[ii + 3] > 200) {
          out[si + 3] = 0;
        }
      }
    }
  }

  await sharp(out, { raw: { width: sw, height: sh, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, 'selectionOverlay.png'));
  console.log('selectionOverlay.png');
}

async function makeSelectedCard(idleName, outName) {
  const idlePath = join(outDir, `${idleName}.png`);
  const overlayPath = join(outDir, 'selectionOverlay.png');
  const idleMeta = await sharp(idlePath).metadata();
  const resizedOverlay = await sharp(overlayPath)
    .resize(idleMeta.width, idleMeta.height)
    .toBuffer();
  await sharp(idlePath)
    .composite([{ input: resizedOverlay, blend: 'over' }])
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, `${outName}.png`));
  console.log(`${outName}.png`);
}

for (const [name, region] of Object.entries(REGIONS)) {
  await crop(name, region);
}

await makeBeautyIdle();
await crop('cardBeautySelected', REGIONS.cardBeautySelected);
await makeSelectionOverlay();
await makeSelectedCard('cardRepairIdle', 'cardRepairSelected');
await makeSelectedCard('cardCleaningIdle', 'cardCleaningSelected');
await makeSelectedCard('cardBeautyIdle', 'cardBeautySelectedFromIdle');

console.log('Done.');
