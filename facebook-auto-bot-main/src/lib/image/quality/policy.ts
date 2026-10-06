/**
 * Policy Validation
 *
 * Evaluates policy compliance (watermarks, branding, text, etc.).
 * This is currently a placeholder for future implementation.
 */

import type { PolicyValidationResult, ValidationStatus } from "./types";

/**
 * Validate policy compliance
 *
 * Currently, we cannot reliably detect watermarks, branding, or text
 * without a computer vision library. This creates the interface for
 * future implementation.
 */
export async function validatePolicy(): Promise<PolicyValidationResult> {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Placeholder for future CV-based detection
  const hasWatermark: ValidationStatus = "NOT_EVALUATED";
  const hasBranding: ValidationStatus = "NOT_EVALUATED";
  const hasExcessiveText: ValidationStatus = "NOT_EVALUATED";
  const hasUnwantedLogo: ValidationStatus = "NOT_EVALUATED";
  const hasThirdPartyBranding: ValidationStatus = "NOT_EVALUATED";

  warnings.push("Watermark/branding detection not implemented (requires CV library)");

  return {
    status: warnings.length > 0 ? "WARN" : "PASS",
    hasWatermark,
    hasBranding,
    hasExcessiveText,
    hasUnwantedLogo,
    hasThirdPartyBranding,
    issues,
    warnings,
  };
}
