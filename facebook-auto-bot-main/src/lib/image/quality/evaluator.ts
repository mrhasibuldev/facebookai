/**
 * Image Quality Evaluator
 *
 * Main entry point for quality evaluation.
 * Combines all validation modules and produces a unified quality result.
 */

import type { ImageQualityResult, QualityConfig } from "./types";
import { validateTechnical } from "./technical";
import { validateSemantic } from "./semantic";
import { validateVisual } from "./visual";
import { validatePolicy } from "./policy";
import { validateRepetition } from "./repetition";
import { makeQualityDecision } from "./decision";

/**
 * Evaluate image quality
 *
 * Performs all available quality checks and returns a unified result.
 */
export async function evaluateImageQuality(
  blob: Blob,
  config: QualityConfig = {}
): Promise<ImageQualityResult> {
  // If quality control is disabled, return ACCEPT
  if (config.enabled === false) {
    return {
      decision: "ACCEPT",
      reason: "Quality control is disabled",
      technical: {
        status: "NOT_EVALUATED",
        imageExists: true,
        validMimeType: true,
        isImage: true,
        minWidthCheck: "NOT_EVALUATED",
        minHeightCheck: "NOT_EVALUATED",
        aspectRatioCheck: "NOT_EVALUATED",
        issues: [],
        warnings: [],
      },
      semantic: {
        status: "NOT_EVALUATED",
        issues: [],
        warnings: [],
      },
      visual: {
        status: "NOT_EVALUATED",
        tooBlurry: "NOT_EVALUATED",
        tooDark: "NOT_EVALUATED",
        tooBright: "NOT_EVALUATED",
        isBlank: "NOT_EVALUATED",
        lowInformation: "NOT_EVALUATED",
        hasArtifacts: "NOT_EVALUATED",
        issues: [],
        warnings: [],
      },
      policy: {
        status: "NOT_EVALUATED",
        hasWatermark: "NOT_EVALUATED",
        hasBranding: "NOT_EVALUATED",
        hasExcessiveText: "NOT_EVALUATED",
        hasUnwantedLogo: "NOT_EVALUATED",
        hasThirdPartyBranding: "NOT_EVALUATED",
        issues: [],
        warnings: [],
      },
      repetition: {
        status: "NOT_EVALUATED",
        isSimilarToRecent: "NOT_EVALUATED",
        issues: [],
        warnings: [],
      },
      allIssues: [],
      allWarnings: [],
      evaluatorVersion: "1.0.0",
      timestamp: new Date().toISOString(),
    };
  }

  // Run all validations in parallel where possible
  const [technical, semantic, visual, policy, repetition] = await Promise.all([
    validateTechnical(blob, config),
    validateSemantic(),
    validateVisual(blob),
    validatePolicy(),
    validateRepetition(blob),
  ]);

  // Make decision (first attempt, no retries)
  const result = makeQualityDecision(
    technical,
    semantic,
    visual,
    policy,
    repetition,
    { maxRetries: config.maxRetries ?? 2, currentAttempt: 0 }
  );

  return result;
}

/**
 * Evaluate image quality with retry context
 *
 * Used when retrying after a failed quality check.
 */
export async function evaluateImageQualityWithRetry(
  blob: Blob,
  retryAttempt: number,
  config: QualityConfig = {}
): Promise<ImageQualityResult> {
  // Run validations
  const [technical, semantic, visual, policy, repetition] = await Promise.all([
    validateTechnical(blob, config),
    validateSemantic(),
    validateVisual(blob),
    validatePolicy(),
    validateRepetition(blob),
  ]);

  // Make decision with retry context
  const result = makeQualityDecision(
    technical,
    semantic,
    visual,
    policy,
    repetition,
    { maxRetries: config.maxRetries ?? 2, currentAttempt: retryAttempt }
  );

  return result;
}
