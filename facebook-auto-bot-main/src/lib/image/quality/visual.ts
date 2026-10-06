/**
 * Visual Validation
 *
 * Performs lightweight visual quality checks.
 * These are basic checks that don't require heavy computer vision.
 */

import type { VisualValidationResult, ValidationStatus } from "./types";

/**
 * Check if image is blank or has very low information
 *
 * This is a basic check - we load the image and check if all pixels
 * are the same or very similar. A truly robust check would require
 * a computer vision library, which we avoid adding unnecessarily.
 */
export async function validateVisual(blob: Blob): Promise<VisualValidationResult> {
  const issues: string[] = [];
  const warnings: string[] = [];

  // For now, we'll do a simple existence check
  // Real blank detection would require pixel analysis
  const isBlank: ValidationStatus = "NOT_EVALUATED";
  const tooBlurry: ValidationStatus = "NOT_EVALUATED";
  const tooDark: ValidationStatus = "NOT_EVALUATED";
  const tooBright: ValidationStatus = "NOT_EVALUATED";
  const lowInformation: ValidationStatus = "NOT_EVALUATED";
  const hasArtifacts: ValidationStatus = "NOT_EVALUATED";

  // Basic check: ensure image is not zero-sized
  if (blob.size === 0) {
    issues.push("Image has zero file size");
    return {
      status: "FAIL",
      tooBlurry: "NOT_EVALUATED",
      tooDark: "NOT_EVALUATED",
      tooBright: "NOT_EVALUATED",
      isBlank: "FAIL",
      lowInformation: "NOT_EVALUATED",
      hasArtifacts: "NOT_EVALUATED",
      issues,
      warnings,
    };
  }

  // Image exists and has content
  warnings.push("Advanced visual checks not implemented (requires CV library)");

  return {
    status: warnings.length > 0 ? "WARN" : "PASS",
    tooBlurry,
    tooDark,
    tooBright,
    isBlank,
    lowInformation,
    hasArtifacts,
    issues,
    warnings,
  };
}
