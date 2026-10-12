import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c >>> 0;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createPng(width, height, getPixel) {
  const rowBytes = width * 4;
  const rawData = Buffer.alloc(height * (1 + rowBytes));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + rowBytes);
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function createChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const toCrc = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function renderEngineIcon(x, y, w, h, isMaskable = false) {
  // Normalize coords to 0..512
  const scale = 512 / w;
  const nx = x * scale;
  const ny = y * scale;

  // Background
  const bgR = 9, bgG = 13, bgB = 22;

  // Corner radius check if not maskable
  if (!isMaskable) {
    const r = 96;
    let inCorner = false;
    let distSq = 0;
    if (nx < r && ny < r) {
      distSq = (nx - r) ** 2 + (ny - r) ** 2;
      inCorner = distSq > r * r;
    } else if (nx > 512 - r && ny < r) {
      distSq = (nx - (512 - r)) ** 2 + (ny - r) ** 2;
      inCorner = distSq > r * r;
    } else if (nx < r && ny > 512 - r) {
      distSq = (nx - r) ** 2 + (ny - (512 - r)) ** 2;
      inCorner = distSq > r * r;
    } else if (nx > 512 - r && ny > 512 - r) {
      distSq = (nx - (512 - r)) ** 2 + (ny - (512 - r)) ** 2;
      inCorner = distSq > r * r;
    }
    if (inCorner) return [0, 0, 0, 0];
  }

  // Base background
  let col = [bgR, bgG, bgB, 255];

  // Cylinder chamber outline: x in [146, 366], y in [70, 330]
  if (nx >= 146 && nx <= 366 && ny >= 70 && ny <= 330) {
    const border = 8;
    if (nx < 146 + border || nx > 366 - border || ny < 70 + border || ny > 330 - border) {
      // Cylinder dotted/dashed wall
      if ((Math.floor(nx / 20) + Math.floor(ny / 20)) % 2 === 0) {
        col = [51, 65, 85, 255]; // #334155
      }
    }
  }

  // Spark explosion glow around (256, 130)
  const glowDist = Math.hypot(nx - 256, ny - 130);
  if (glowDist < 90) {
    const factor = Math.max(0, 1 - glowDist / 90);
    // Blend with orange/red glow
    col[0] = Math.min(255, col[0] + Math.floor(245 * factor * 0.7));
    col[1] = Math.min(255, col[1] + Math.floor(158 * factor * 0.6));
    col[2] = Math.min(255, col[2] + Math.floor(11 * factor * 0.4));
  }

  // Spark plug top: x in [246, 266], y in [40, 90]
  if (nx >= 246 && nx <= 266 && ny >= 40 && ny <= 90) {
    col = [248, 250, 252, 255]; // white ceramic
  }
  // Spark electrode
  if (nx >= 248 && nx <= 264 && ny >= 92 && ny <= 110) {
    col = [251, 191, 36, 255]; // gold spark
  }

  // V-engine dynamic accent rays from journal (256, 350)
  // Left ray to (160, 230)
  // Distance to line segment
  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  const dRay1 = distToSegment(nx, ny, 256, 350, 160, 230);
  if (dRay1 <= 4) col = [244, 63, 94, 255]; // rose accent

  const dRay2 = distToSegment(nx, ny, 256, 350, 352, 230);
  if (dRay2 <= 4) col = [14, 165, 233, 255]; // cyan accent

  // Connecting rod: quadrilateral between (246, 200), (266, 200), (270, 340), (242, 340)
  if (ny >= 200 && ny <= 340) {
    const leftX = 246 - (4 * (ny - 200)) / 140;
    const rightX = 266 + (4 * (ny - 200)) / 140;
    if (nx >= leftX && nx <= rightX) {
      col = [100, 116, 139, 255]; // slate metal
    }
  }

  // Crankshaft journal outer: center (256, 350), r = 34
  const cDist = Math.hypot(nx - 256, ny - 350);
  if (cDist <= 34) {
    if (cDist >= 26) {
      col = [14, 165, 233, 255]; // blue ring
    } else if (cDist <= 14) {
      col = [14, 165, 233, 255]; // blue core
    } else {
      col = [51, 65, 85, 255]; // dark metal
    }
  }

  // Piston head: x in [160, 352], y in [140, 240]
  if (nx >= 160 && nx <= 352 && ny >= 140 && ny <= 240) {
    // Metal gradient across x
    const frac = (nx - 160) / 192;
    const metalVal = 100 + Math.floor(Math.sin(frac * Math.PI) * 110);
    col = [metalVal, metalVal + 15, metalVal + 30, 255];

    // Piston ring grooves
    if ((ny >= 163 && ny <= 167) || (ny >= 183 && ny <= 187)) {
      col = [30, 41, 59, 255];
    }
    // Wrist pin hole: center (256, 200), r = 16
    const pinDist = Math.hypot(nx - 256, ny - 200);
    if (pinDist <= 16) {
      col = [30, 41, 59, 255];
    }
  }

  return col;
}

const outDir = path.resolve('public');

// 1. pwa-192x192.png
const png192 = createPng(192, 192, (x, y, w, h) => renderEngineIcon(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), png192);
console.log('Generated pwa-192x192.png');

// 2. pwa-512x512.png
const png512 = createPng(512, 512, (x, y, w, h) => renderEngineIcon(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), png512);
console.log('Generated pwa-512x512.png');

// 3. pwa-maskable-512x512.png (padded with background safe zone)
const pngMaskable = createPng(512, 512, (x, y, w, h) => {
  // Safe zone scaling: scale icon down by 0.8 to fit 80% circle
  const cx = 256, cy = 256;
  const sx = (x - cx) / 0.8 + cx;
  const sy = (y - cy) / 0.8 + cy;
  if (sx < 0 || sx >= 512 || sy < 0 || sy >= 512) {
    return [9, 13, 22, 255]; // Full bleed dark background
  }
  return renderEngineIcon(sx, sy, 512, 512, true);
});
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), pngMaskable);
console.log('Generated pwa-maskable-512x512.png');

// 4. apple-touch-icon.png (180x180)
const appleIcon = createPng(180, 180, (x, y, w, h) => renderEngineIcon(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), appleIcon);
console.log('Generated apple-touch-icon.png');

// Also create icon-192.png as symlink/copy for backwards compat with index.html
fs.writeFileSync(path.join(outDir, 'icon-192.png'), png192);
console.log('Generated icon-192.png');
