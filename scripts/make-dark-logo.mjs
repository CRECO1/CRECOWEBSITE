/**
 * One-off: convert "printable resolution-02.jpg" (white-text logo on dark BG)
 * into a transparent-background PNG for use on the transparent hero header.
 *
 * Approach: sample alpha by darkness — pixels near pure black become
 * transparent, with a soft falloff at the edges so the white text edges keep
 * proper anti-aliasing.
 */
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = '/Users/zacharya.stovall/Desktop/CRECO Logos/printable resolution-02.jpg';
const output = path.resolve(__dirname, '../public/images/creco-logo-dark.png');

const THRESHOLD = 70;   // anything darker than this brightness becomes fully transparent
const SOFT_BAND = 30;   // brightness range above THRESHOLD where alpha ramps from 0 → 255

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

// Per-pixel: compute brightness (perceived luma), set alpha based on darkness
for (let i = 0; i < data.length; i += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  // Use perceptual luma (rec. 709)
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  let alpha;
  if (luma <= THRESHOLD) {
    alpha = 0;
  } else if (luma >= THRESHOLD + SOFT_BAND) {
    alpha = 255;
  } else {
    // smooth ramp
    alpha = Math.round(((luma - THRESHOLD) / SOFT_BAND) * 255);
  }
  data[i + 3] = alpha;
}

await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(output);
console.log('✓ wrote', output);

// Print quick stats
const stats = await sharp(output).stats();
console.log('  channels:', info.channels, 'size:', info.width + 'x' + info.height);
console.log('  alpha sum (if 0 = fully transparent):', stats.channels[3]?.mean.toFixed(1) ?? 'n/a');
