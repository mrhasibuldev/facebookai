/**
 * Repetition Detection
 *
 * Evaluates whether this image is too similar to previous images.
 * This creates the interface for future perceptual hash implementation.
 */

import type { RepetitionValidationResult, ValidationStatus } from "./types";

/**
 * Validate repetition
 *
 * Currently, we implement a basic hash-based check that can be extended
 * with perceptual hashing in the future.
 */
export async function validateRepetition(
  blob: Blob,
  previousHashes?: string[]
): Promise<RepetitionValidationResult> {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Generate a simple hash from the blob for future comparison
  const imageHash = await generateSimpleHash(blob);
  const isSimilarToRecent: ValidationStatus = "PASS";

  // If we have previous hashes, check for duplicates
  if (previousHashes && previousHashes.length > 0) {
    if (previousHashes.includes(imageHash)) {
      issues.push("Image is identical to a recently generated image");
      return {
        status: "FAIL",
        imageHash,
        isSimilarToRecent: "FAIL",
        issues,
        warnings,
      };
    }
  }

  warnings.push("Perceptual similarity detection not implemented (requires CV library)");

  return {
    status: warnings.length > 0 ? "WARN" : "PASS",
    imageHash,
    isSimilarToRecent,
    issues,
    warnings,
  };
}

/**
 * Generate a simple hash from a blob
 *
 * This is a basic hash for duplicate detection. Future implementation
 * should use perceptual hashing for better similarity detection.
 */
async function generateSimpleHash(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Simple hash: sum of bytes mod large number
  let hash = 0;
  for (let i = 0; i < bytes.length; i++) {
    hash = ((hash << 5) - hash + bytes[i]) | 0;
  }

  return hash.toString(16);
}
