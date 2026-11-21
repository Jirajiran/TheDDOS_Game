/**
 * Shared lineless pixel-art pool.
 * Static/weapon = single entry. Unit gameplay = per-layer entries
 * (body / assetBottom / assetTop / arm1 / arm2) so arm matrices still animate.
 */

export const ART_POOL_PIXEL = 64;
export const ART_POOL_CELL = 64;
const ART_POOL_PALETTE_STEP = 16;
const ART_POOL_ALPHA_CUT = 140;

/** @type {Map<string, ArtPoolEntry>|null} */
let gameplayPool = null;

/**
 * @typedef {{
 *   cellSize: number,
 *   frameW: number,
 *   frameH: number,
 *   anchorX: number,
 *   anchorY: number,
 *   pixelArt: boolean,
 *   pixels?: Uint8ClampedArray,
 *   dataUrl: string,
 *   image?: HTMLImageElement|null,
 * }} ArtPoolEntry
 */

export function artPoolKeyLayer(kind, groupId) {
  return 'layer:' + kind + '::' + (groupId || '');
}

export function artPoolKeyWeapon(groupName) {
  return 'w:' + (groupName || '');
}

export function artPoolKeyUnitComposite(groupId, spec) {
  const hold = (spec && spec.hold) || '-';
  const gun = (spec && spec.group) || '-';
  return 'u:' + (groupId || '') + '|' + hold + '|' + gun;
}

export function getGameplayArtPool() {
  return gameplayPool;
}

export function setGameplayArtPool(pool) {
  gameplayPool = pool || null;
  return gameplayPool;
}

/** Hard alpha + bucketed RGB → lineless low-bit look. */
export function pixelizeImageData(imageData) {
  const data = imageData.data;
  const step = ART_POOL_PALETTE_STEP;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < ART_POOL_ALPHA_CUT) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
      continue;
    }
    data[i] = Math.min(255, Math.round(data[i] / step) * step);
    data[i + 1] = Math.min(255, Math.round(data[i + 1] / step) * step);
    data[i + 2] = Math.min(255, Math.round(data[i + 2] / step) * step);
    data[i + 3] = 255;
  }
  return imageData;
}

/** Nearest downsample then pixelize. */
export function downsampleToPixelArt(srcCanvas, destW, destH) {
  const out = document.createElement('canvas');
  out.width = destW;
  out.height = destH;
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = false;
  octx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, 0, 0, destW, destH);
  const img = octx.getImageData(0, 0, destW, destH);
  pixelizeImageData(img);
  octx.putImageData(img, 0, 0);
  return out;
}

function loadImageFromUrl(url, decoding) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = decoding || 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('artPool image load failed'));
    img.src = url;
  });
}

/**
 * Raster an SVG markup string → pixel-art entry (fixed dest size).
 * Used by gameplay layers that keep LOCAL_VB / ARM_VB mapping.
 * @returns {Promise<ArtPoolEntry|null>}
 */
export async function rasterMarkupToEntry(markup, destW, destH) {
  const w = Math.max(1, destW | 0);
  const h = Math.max(1, destH | 0);
  if (!markup) return null;
  const hiW = w * 2;
  const hiH = h * 2;
  const url =
    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
  try {
    const img = await loadImageFromUrl(url, 'async');
    const hi = document.createElement('canvas');
    hi.width = hiW;
    hi.height = hiH;
    const hctx = hi.getContext('2d');
    hctx.imageSmoothingEnabled = false;
    hctx.clearRect(0, 0, hiW, hiH);
    hctx.drawImage(img, 0, 0, hiW, hiH);
    const canvas = downsampleToPixelArt(hi, w, h);
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/png');
    const outImg = await loadImageFromUrl(dataUrl, 'async').catch(() => null);
    return {
      cellSize: ART_POOL_PIXEL,
      frameW: w,
      frameH: h,
      anchorX: w / 2,
      anchorY: h / 2,
      pixelArt: true,
      pixels: imageData.data.slice(),
      dataUrl,
      image: outImg,
    };
  } catch (_) {
    return null;
  }
}

/**
 * Raster mounted SVG element / Blob path used by Editor composite frames.
 * @param {string} xmlSvg full SVG document string
 * @param {number} framePx destination square size
 * @returns {Promise<ArtPoolEntry|null>}
 */
export async function rasterSvgXmlToEntry(xmlSvg, framePx) {
  const px = Math.max(ART_POOL_PIXEL, framePx | 0);
  const hiPx = px * 2;
  const blob = new Blob(
    ['<?xml version="1.0" encoding="UTF-8"?>' + xmlSvg],
    { type: 'image/svg+xml;charset=utf-8' }
  );
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImageFromUrl(url, 'sync');
    if (typeof img.decode === 'function') {
      try {
        await img.decode();
      } catch (_) {}
    }
    const hi = document.createElement('canvas');
    hi.width = hiPx;
    hi.height = hiPx;
    const hctx = hi.getContext('2d');
    hctx.imageSmoothingEnabled = false;
    hctx.clearRect(0, 0, hiPx, hiPx);
    hctx.drawImage(img, 0, 0, hiPx, hiPx);
    const canvas = downsampleToPixelArt(hi, px, px);
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, px, px);
    const dataUrl = canvas.toDataURL('image/png');
    const outImg = await loadImageFromUrl(dataUrl, 'async').catch(() => null);
    return {
      cellSize: ART_POOL_PIXEL,
      frameW: px,
      frameH: px,
      anchorX: px / 2,
      anchorY: px / 2,
      pixelArt: true,
      pixels: imageData.data.slice(),
      dataUrl,
      image: outImg,
    };
  } catch (_) {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function yieldPaint() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 0);
  });
}

/**
 * Ensure entry.image is loaded (for canvas drawImage).
 * @param {ArtPoolEntry|null|undefined} entry
 * @returns {Promise<HTMLImageElement|null>}
 */
export async function ensureEntryImage(entry) {
  if (!entry) return null;
  if (entry.image && entry.image.complete) return entry.image;
  if (!entry.dataUrl) return null;
  const img = await loadImageFromUrl(entry.dataUrl, 'async').catch(() => null);
  entry.image = img;
  return img;
}
