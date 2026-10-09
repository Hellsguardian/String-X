/**
 * Profile photo optimization (dependency-free, client-side).
 *
 * Pipeline:
 *   File -> decode (with EXIF orientation applied) -> proportional downscale
 *   (longest side <= 1280px, never upscale, NEVER crop) -> canvas re-encode
 *   (drops EXIF/GPS/camera metadata) -> WebP with progressive quality
 *   -> JPEG fallback only when the browser cannot genuinely encode WebP.
 *
 * The original File is never returned. If optimization fails, an
 * ImageOptimizationError is thrown so callers can show a friendly message.
 *
 * Scope: profile photos only. Verification selfies use a separate pipeline.
 */

export const PROFILE_PHOTO_MAX_DIMENSION = 1280;
/** Compression threshold (not a hard limit): stop stepping quality once below this. */
export const PROFILE_PHOTO_TARGET_BYTES = 300 * 1024;
export const PROFILE_PHOTO_WEBP_QUALITY_STEPS = [0.82, 0.75, 0.68] as const;
export const PROFILE_PHOTO_JPEG_FALLBACK_QUALITY = 0.82;

export type ImageOptimizationErrorCode = 'NOT_AN_IMAGE' | 'DECODE_FAILED' | 'ENCODE_FAILED';

export class ImageOptimizationError extends Error {
  readonly code: ImageOptimizationErrorCode;

  constructor(code: ImageOptimizationErrorCode, message: string) {
    super(message);
    this.name = 'ImageOptimizationError';
    this.code = code;
  }
}

export interface ContainedDimensions {
  width: number;
  height: number;
}

/**
 * Computes output dimensions using ONE scale factor for both axes so the whole
 * image fits inside a maxDimension x maxDimension box. Never upscales, never crops.
 *
 * 4000x3000 -> 1280x960, 3000x4000 -> 960x1280, 1000x1500 -> 853x1280, 800x600 -> 800x600
 */
export function calculateContainedDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxDimension: number = PROFILE_PHOTO_MAX_DIMENSION
): ContainedDimensions {
  if (!(sourceWidth > 0) || !(sourceHeight > 0)) {
    throw new ImageOptimizationError('DECODE_FAILED', 'Image has invalid dimensions.');
  }
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

/**
 * Decodes the file with its EXIF orientation applied.
 * Prefers createImageBitmap(imageOrientation: 'from-image'); falls back to an
 * <img> element (modern browsers apply EXIF orientation when drawing images).
 */
async function decodeImage(file: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      if (bitmap.width > 0 && bitmap.height > 0) {
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          release: () => bitmap.close(),
        };
      }
      bitmap.close();
    } catch {
      // Fall through to the <img> decoder (older Safari rejects the options bag).
    }
  }

  const objectUrl = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = 'async';
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image element failed to load'));
      img.src = objectUrl;
    });
    if (typeof img.decode === 'function') {
      await img.decode();
    }
  } catch {
    URL.revokeObjectURL(objectUrl);
    throw new ImageOptimizationError(
      'DECODE_FAILED',
      'This image could not be read. Please choose a JPG, PNG, or supported image.'
    );
  }

  if (!img.naturalWidth || !img.naturalHeight) {
    URL.revokeObjectURL(objectUrl);
    throw new ImageOptimizationError(
      'DECODE_FAILED',
      'This image could not be read. Please choose a JPG, PNG, or supported image.'
    );
  }

  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    release: () => {
      img.removeAttribute('src');
      URL.revokeObjectURL(objectUrl);
    },
  };
}

function createCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new ImageOptimizationError('ENCODE_FAILED', 'Image processing is not supported on this device.');
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return { canvas, ctx };
}

function releaseCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0;
  canvas.height = 0;
}

/**
 * Draws the COMPLETE source into a target-sized canvas.
 * Only the 5-argument drawImage(source, 0, 0, w, h) form is used: there is no
 * source rectangle, so nothing is ever cropped. Large reductions are performed
 * in successive halvings for better downscale quality (each step still draws
 * the entire previous image).
 */
function renderFullImage(decoded: DecodedImage, target: ContainedDimensions): HTMLCanvasElement {
  let currentSource: CanvasImageSource = decoded.source;
  let currentWidth = decoded.width;
  let currentHeight = decoded.height;
  let intermediate: HTMLCanvasElement | null = null;

  while (currentWidth / 2 >= target.width && currentHeight / 2 >= target.height) {
    const stepWidth = Math.max(target.width, Math.round(currentWidth / 2));
    const stepHeight = Math.max(target.height, Math.round(currentHeight / 2));
    const { canvas, ctx } = createCanvas(stepWidth, stepHeight);
    ctx.drawImage(currentSource, 0, 0, stepWidth, stepHeight);
    if (intermediate) releaseCanvas(intermediate);
    intermediate = canvas;
    currentSource = canvas;
    currentWidth = stepWidth;
    currentHeight = stepHeight;
  }

  const { canvas: output, ctx } = createCanvas(target.width, target.height);
  ctx.drawImage(currentSource, 0, 0, target.width, target.height);
  if (intermediate) releaseCanvas(intermediate);
  return output;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    } catch {
      resolve(null);
    }
  });
}

/** WebP with progressive quality. Returns null if the browser cannot genuinely encode WebP. */
async function encodeWebp(canvas: HTMLCanvasElement): Promise<Blob | null> {
  let best: Blob | null = null;
  for (const quality of PROFILE_PHOTO_WEBP_QUALITY_STEPS) {
    const blob = await canvasToBlob(canvas, 'image/webp', quality);
    // Browsers without WebP encoding silently return PNG: verify, never assume.
    if (!blob || blob.type !== 'image/webp') {
      return null;
    }
    best = blob;
    if (blob.size <= PROFILE_PHOTO_TARGET_BYTES) {
      break;
    }
  }
  // Above the threshold at the lowest step: keep that result rather than degrade further.
  return best;
}

/** JPEG fallback: flatten onto white so transparent pixels do not turn black. */
async function encodeJpegFallback(rendered: HTMLCanvasElement): Promise<Blob> {
  const { canvas, ctx } = createCanvas(rendered.width, rendered.height);
  try {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(rendered, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToBlob(canvas, 'image/jpeg', PROFILE_PHOTO_JPEG_FALLBACK_QUALITY);
    if (!blob || blob.type !== 'image/jpeg') {
      throw new ImageOptimizationError('ENCODE_FAILED', 'This image could not be processed. Please try another photo.');
    }
    return blob;
  } finally {
    releaseCanvas(canvas);
  }
}

function looksLikeImage(file: Blob): boolean {
  const type = (file.type || '').toLowerCase();
  if (type) return type.startsWith('image/');
  // Some browsers report an empty type (e.g. HEIC on Windows/Android): let the decoder decide.
  return true;
}

/**
 * Optimizes a user-selected profile photo.
 * Resolves with ONLY the optimized Blob (image/webp, or image/jpeg when WebP
 * encoding is unavailable). Never resolves with the original file.
 */
export async function optimizeProfilePhoto(file: File | Blob): Promise<Blob> {
  if (!file || !looksLikeImage(file)) {
    throw new ImageOptimizationError('NOT_AN_IMAGE', 'Please choose a JPG, PNG, or supported image.');
  }

  const decoded = await decodeImage(file);
  let released = false;
  const releaseDecoded = () => {
    if (released) return;
    released = true;
    decoded.release();
  };
  let rendered: HTMLCanvasElement | null = null;
  try {
    const target = calculateContainedDimensions(decoded.width, decoded.height);
    rendered = renderFullImage(decoded, target);
    // Free the full-resolution decode before encoding (large phone photos).
    releaseDecoded();

    const webp = await encodeWebp(rendered);
    if (webp) return webp;

    return await encodeJpegFallback(rendered);
  } catch (err) {
    if (err instanceof ImageOptimizationError) throw err;
    throw new ImageOptimizationError('ENCODE_FAILED', 'This image could not be processed. Please try another photo.');
  } finally {
    releaseDecoded();
    if (rendered) releaseCanvas(rendered);
  }
}

/** Converts an (optimized) Blob into a data URL for preview and the existing upload flow. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new ImageOptimizationError('ENCODE_FAILED', 'Could not prepare the optimized photo.'));
    };
    reader.onerror = () =>
      reject(new ImageOptimizationError('ENCODE_FAILED', 'Could not prepare the optimized photo.'));
    reader.readAsDataURL(blob);
  });
}
