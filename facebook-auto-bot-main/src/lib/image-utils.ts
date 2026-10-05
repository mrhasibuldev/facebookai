/**
 * Client-side image processing utilities for avatar optimization.
 * Resizes and compresses images before upload to minimize Supabase Storage usage.
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const TARGET_SIZE = 512; // 512x512 pixels
const TARGET_QUALITY = 0.85; // 85% quality
const TARGET_FORMAT = 'image/webp';

export interface ProcessedImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Validates and processes an image file for avatar upload.
 * Resizes to 512x512, compresses, and converts to WebP if supported.
 */
export async function processAvatarImage(file: File): Promise<ProcessedImageResult> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB limit`);
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please use JPEG, PNG, or WebP');
  }

  // Load image
  const imageDataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(imageDataUrl);

  // Calculate dimensions (maintain aspect ratio, fit within TARGET_SIZE)
  const { width, height } = calculateDimensions(img.width, img.height, TARGET_SIZE);

  // Create canvas for resizing
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  // Draw resized image
  ctx.drawImage(img, 0, 0, width, height);

  // Convert to blob with compression
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to compress image'));
        }
      },
      TARGET_FORMAT,
      TARGET_QUALITY
    );
  });

  const dataUrl = canvas.toDataURL(TARGET_FORMAT, TARGET_QUALITY);

  return {
    blob,
    dataUrl,
    width,
    height,
    size: blob.size,
  };
}

/**
 * Reads a file as a data URL.
 */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Loads an image from a data URL.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Calculates dimensions to fit an image within a target size while maintaining aspect ratio.
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  targetSize: number
): { width: number; height: number } {
  if (originalWidth <= targetSize && originalHeight <= targetSize) {
    return { width: originalWidth, height: originalHeight };
  }

  const ratio = Math.min(targetSize / originalWidth, targetSize / originalHeight);
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
}

/**
 * Gets user initials from name for fallback avatar.
 */
export function getUserInitials(name: string | null | undefined): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
