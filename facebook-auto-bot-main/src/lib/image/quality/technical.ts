/**
 * Technical Validation
 *
 * Performs real, measurable technical checks on generated images.
 * These are objective checks that don't require AI/CV.
 */

import type { TechnicalValidationResult, ValidationStatus } from "./types";

const DEFAULT_MIN_WIDTH = 400;
const DEFAULT_MIN_HEIGHT = 400;
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate image dimensions meet minimum requirements
 */
function validateDimensions(
  width: number,
  height: number,
  minWidth: number,
  minHeight: number
): { widthCheck: ValidationStatus; heightCheck: ValidationStatus } {
  const widthCheck = width >= minWidth ? "PASS" : "FAIL";
  const heightCheck = height >= minHeight ? "PASS" : "FAIL";

  return { widthCheck, heightCheck };
}

/**
 * Validate aspect ratio is reasonable
 */
function validateAspectRatio(width: number, height: number): ValidationStatus {
  // Reject extreme aspect ratios (too wide or too tall)
  const ratio = width / height;
  if (ratio < 0.1 || ratio > 10) {
    return "FAIL";
  }
  // Warn about non-standard ratios but accept
  if (ratio < 0.5 || ratio > 2) {
    return "WARN";
  }
  return "PASS";
}

/**
 * Validate file size is reasonable
 */
function validateFileSize(fileSize: number, maxSize: number): ValidationStatus {
  if (fileSize > maxSize) {
    return "FAIL";
  }
  if (fileSize > maxSize * 0.8) {
    return "WARN";
  }
  return "PASS";
}

/**
 * Validate MIME type is an image
 */
function validateMimeType(mimeType: string): { valid: boolean; isImage: boolean } {
  const valid = mimeType !== undefined && mimeType !== null && mimeType !== "";
  const isImage = valid && mimeType.startsWith("image/");
  return { valid, isImage };
}

/**
 * Perform technical validation on an image blob
 */
export async function validateTechnical(
  blob: Blob,
  config: { minWidth?: number; minHeight?: number; maxFileSize?: number } = {}
): Promise<TechnicalValidationResult> {
  const issues: string[] = [];
  const warnings: string[] = [];

  const minWidth = config.minWidth ?? DEFAULT_MIN_WIDTH;
  const minHeight = config.minHeight ?? DEFAULT_MIN_HEIGHT;
  const maxSize = config.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;

  // Check image exists
  const imageExists = blob !== null && blob !== undefined && blob.size > 0;
  if (!imageExists) {
    issues.push("Image blob is empty or null");
    return {
      status: "FAIL",
      imageExists: false,
      validMimeType: false,
      isImage: false,
      minWidthCheck: "NOT_EVALUATED",
      minHeightCheck: "NOT_EVALUATED",
      aspectRatioCheck: "NOT_EVALUATED",
      issues,
      warnings,
    };
  }

  // Validate MIME type
  const mimeType = blob.type;
  const { valid: validMimeType, isImage } = validateMimeType(mimeType);
  if (!validMimeType) {
    issues.push("Invalid or missing MIME type");
  }
  if (!isImage) {
    issues.push(`File is not an image: ${mimeType}`);
  }

  // Validate file size
  const fileSize = blob.size;
  const fileSizeCheck = validateFileSize(fileSize, maxSize);
  if (fileSizeCheck === "FAIL") {
    issues.push(`File size ${fileSize} bytes exceeds maximum ${maxSize} bytes`);
  } else if (fileSizeCheck === "WARN") {
    warnings.push(`File size ${fileSize} bytes is large`);
  }

  // Get dimensions by loading the image
  let dimensions: { width: number; height: number } | undefined;
  let minWidthCheck: ValidationStatus = "NOT_EVALUATED";
  let minHeightCheck: ValidationStatus = "NOT_EVALUATED";
  let aspectRatioCheck: ValidationStatus = "NOT_EVALUATED";

  try {
    const dims = await getImageDimensions(blob);
    dimensions = dims;

    // Validate dimensions
    const dimCheck = validateDimensions(dims.width, dims.height, minWidth, minHeight);
    minWidthCheck = dimCheck.widthCheck;
    minHeightCheck = dimCheck.heightCheck;

    if (minWidthCheck === "FAIL") {
      issues.push(`Width ${dims.width}px is below minimum ${minWidth}px`);
    }
    if (minHeightCheck === "FAIL") {
      issues.push(`Height ${dims.height}px is below minimum ${minHeight}px`);
    }

    // Validate aspect ratio
    aspectRatioCheck = validateAspectRatio(dims.width, dims.height);
    if (aspectRatioCheck === "FAIL") {
      issues.push(`Aspect ratio ${dims.width}x${dims.height} is extreme`);
    } else if (aspectRatioCheck === "WARN") {
      warnings.push(`Aspect ratio ${dims.width}x${dims.height} is non-standard`);
    }
  } catch (error) {
    issues.push(`Failed to get image dimensions: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Determine overall status
  const hasFailures = issues.length > 0;
  const hasWarnings = warnings.length > 0;

  const status: ValidationStatus = hasFailures ? "FAIL" : hasWarnings ? "WARN" : "PASS";

  return {
    status,
    imageExists,
    validMimeType,
    mimeType,
    isImage,
    dimensions,
    fileSize,
    minWidthCheck,
    minHeightCheck,
    aspectRatioCheck,
    issues,
    warnings,
  };
}

/**
 * Get image dimensions from a blob
 */
async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for dimension check"));
    };

    img.src = url;
  });
}
