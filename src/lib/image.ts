export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'];

export type ImageErrorCode = 'type' | 'size' | 'decode';

export class ImageProcessingError extends Error {
  readonly code: ImageErrorCode;
  constructor(code: ImageErrorCode) {
    super(code);
    this.code = code;
  }
}

export function validateImageFile(file: { type: string; size: number }): ImageErrorCode | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'type';
  if (file.size > MAX_UPLOAD_BYTES) return 'size';
  return null;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageProcessingError('decode'));
    img.src = src;
  });
}

let webpSupport: boolean | null = null;
function supportsWebp(): boolean {
  if (webpSupport === null) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    webpSupport = c.toDataURL('image/webp').startsWith('data:image/webp');
  }
  return webpSupport;
}

/**
 * Liest eine Bilddatei, verkleinert sie auf maxSize Pixel (längste Seite) und gibt eine kompakte Data-URL zurück.
 * Transparenz bleibt erhalten (WebP bzw. PNG).
 */
export async function processLogoFile(file: File, maxSize = 512): Promise<string> {
  const problem = validateImageFile(file);
  if (problem) throw new ImageProcessingError(problem);
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const w = img.naturalWidth || maxSize;
    const h = img.naturalHeight || maxSize;
    const scale = Math.min(1, maxSize / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ImageProcessingError('decode');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return supportsWebp() ? canvas.toDataURL('image/webp', 0.9) : canvas.toDataURL('image/png');
  } catch (err) {
    if (err instanceof ImageProcessingError) throw err;
    throw new ImageProcessingError('decode');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
