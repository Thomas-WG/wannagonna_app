/** Max original file size allowed before upload (matches complete-profile validation). */
export const MAX_AVATAR_UPLOAD_BYTES = 12 * 1024 * 1024;
export const MAX_AVATAR_UPLOAD_MB = 12;

const DEFAULT_MAX_DIMENSION = 512;
const DEFAULT_QUALITY = 0.85;
const JPEG_MIME = 'image/jpeg';
/** Skip re-encode when already small on disk and within pixel cap (avoids JPEG generation loss). */
const SKIP_MAX_BYTES = 350 * 1024;

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif']);

/**
 * Whether the file is acceptable as an avatar picker selection (MIME or extension fallback).
 * @param {File} file
 * @returns {boolean}
 */
export function isValidAvatarFileType(file) {
  if (!file) return false;
  if (file.type.startsWith('image/')) return true;
  if (!file.type) {
    const name = file.name || '';
    const ext = name.split('.').pop()?.toLowerCase();
    return Boolean(ext && ALLOWED_EXTENSIONS.has(ext));
  }
  return false;
}

/**
 * @param {File} file
 * @param {number} [maxBytes]
 * @returns {boolean}
 */
export function isAvatarFileWithinSizeLimit(file, maxBytes = MAX_AVATAR_UPLOAD_BYTES) {
  if (!file) return false;
  return file.size <= maxBytes;
}

/**
 * Downscale and compress avatar images for Storage upload. Falls back to original file on failure.
 * @param {File} file
 * @param {{ maxDimension?: number, quality?: number }} [options]
 * @returns {Promise<File>}
 */
export async function resizeAvatarImageForUpload(file, options = {}) {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options.quality ?? DEFAULT_QUALITY;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (err) {
    console.error('resizeAvatarImageForUpload: createImageBitmap failed, using original', err);
    return file;
  }

  try {
    const { width, height } = bitmap;
    const withinDimensions = width <= maxDimension && height <= maxDimension;
    const withinBytes = file.size <= SKIP_MAX_BYTES;
    if (withinDimensions && withinBytes) {
      bitmap.close();
      return file;
    }

    const scale = Math.min(maxDimension / width, maxDimension / height, 1);
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();
    bitmap = null;

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
        JPEG_MIME,
        quality
      );
    });

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar';
    return new File([blob], `${baseName}.jpg`, {
      type: JPEG_MIME,
      lastModified: Date.now(),
    });
  } catch (err) {
    if (bitmap) {
      try {
        bitmap.close();
      } catch {
        /* ignore */
      }
    }
    console.error('resizeAvatarImageForUpload: resize failed, using original', err);
    return file;
  }
}
