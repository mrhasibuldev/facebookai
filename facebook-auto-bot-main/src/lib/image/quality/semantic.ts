/**
 * Semantic Validation
 *
 * Evaluates whether the image actually represents the requested topic.
 * This currently provides an interface for future AI/CV implementation.
 */

import type { SemanticValidationResult } from "./types";

/**
 * Validate semantic relevance
 *
 * Currently, we cannot reliably evaluate semantic relevance without
 * an AI model or computer vision system. This creates the interface
 * for future implementation.
 */
export async function validateSemantic(): Promise<SemanticValidationResult> {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Placeholder for future AI-based semantic evaluation
  warnings.push("Semantic relevance evaluation not implemented (requires AI/CV)");

  return {
    status: "NOT_EVALUATED",
    issues,
    warnings,
  };
}
