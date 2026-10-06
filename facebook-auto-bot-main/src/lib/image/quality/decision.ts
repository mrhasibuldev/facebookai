/**
 * Quality Decision Engine
 *
 * Combines validation results and makes a final quality decision.
 * Implements controlled retry logic with reason-aware variation.
 */

import type {
  ImageQualityResult,
  QualityDecision,
  TechnicalValidationResult,
  SemanticValidationResult,
  VisualValidationResult,
  PolicyValidationResult,
  RepetitionValidationResult,
} from "./types";

const EVALUATOR_VERSION = "1.0.0";

/**
 * Decision configuration
 */
interface DecisionConfig {
  /** Maximum retry attempts */
  maxRetries: number;
  /** Current retry attempt (0-indexed) */
  currentAttempt: number;
}

/**
 * Make quality decision based on validation results
 */
export function makeQualityDecision(
  technical: TechnicalValidationResult,
  semantic: SemanticValidationResult,
  visual: VisualValidationResult,
  policy: PolicyValidationResult,
  repetition: RepetitionValidationResult,
  config: DecisionConfig = { maxRetries: 2, currentAttempt: 0 }
): ImageQualityResult {
  const allIssues: string[] = [];
  const allWarnings: string[] = [];

  // Collect all issues and warnings
  allIssues.push(...technical.issues);
  allIssues.push(...semantic.issues);
  allIssues.push(...visual.issues);
  allIssues.push(...policy.issues);
  allIssues.push(...repetition.issues);

  allWarnings.push(...technical.warnings);
  allWarnings.push(...semantic.warnings);
  allWarnings.push(...visual.warnings);
  allWarnings.push(...policy.warnings);
  allWarnings.push(...repetition.warnings);

  // Determine decision based on results
  const decision = determineDecision(
    technical,
    semantic,
    visual,
    policy,
    repetition,
    config
  );

  const reason = explainDecision(decision, technical, semantic, visual, policy, repetition);

  return {
    decision,
    reason,
    technical,
    semantic,
    visual,
    policy,
    repetition,
    allIssues,
    allWarnings,
    evaluatorVersion: EVALUATOR_VERSION,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Determine the quality decision
 */
function determineDecision(
  technical: TechnicalValidationResult,
  semantic: SemanticValidationResult,
  visual: VisualValidationResult,
  policy: PolicyValidationResult,
  repetition: RepetitionValidationResult,
  config: DecisionConfig
): QualityDecision {
  // Technical failure → REJECT or FALLBACK
  if (technical.status === "FAIL") {
    // If we haven't exhausted retries, retry
    if (config.currentAttempt < config.maxRetries) {
      return "RETRY";
    }
    // Otherwise fallback to other source
    return "FALLBACK";
  }

  // Repetition → RETRY with variation
  if (repetition.status === "FAIL") {
    if (config.currentAttempt < config.maxRetries) {
      return "RETRY";
    }
    return "FALLBACK";
  }

  // Strong policy violation → RETRY or FALLBACK
  if (policy.status === "FAIL") {
    if (config.currentAttempt < config.maxRetries) {
      return "RETRY";
    }
    return "FALLBACK";
  }

  // Semantic mismatch → RETRY
  if (semantic.status === "FAIL") {
    if (config.currentAttempt < config.maxRetries) {
      return "RETRY";
    }
    return "FALLBACK";
  }

  // Visual quality failure → RETRY
  if (visual.status === "FAIL") {
    if (config.currentAttempt < config.maxRetries) {
      return "RETRY";
    }
    return "FALLBACK";
  }

  // Warnings but no failures → ACCEPT
  if (technical.status === "WARN" ||
      semantic.status === "WARN" ||
      visual.status === "WARN" ||
      policy.status === "WARN" ||
      repetition.status === "WARN") {
    return "ACCEPT";
  }

  // All pass → ACCEPT
  return "ACCEPT";
}

/**
 * Explain the decision with a human-readable reason
 */
function explainDecision(
  decision: QualityDecision,
  technical: TechnicalValidationResult,
  semantic: SemanticValidationResult,
  visual: VisualValidationResult,
  policy: PolicyValidationResult,
  repetition: RepetitionValidationResult
): string {
  switch (decision) {
    case "ACCEPT":
      return "Image passed all quality checks";
    case "RETRY":
      if (technical.status === "FAIL") {
        return "Technical validation failed, retrying with new parameters";
      }
      if (repetition.status === "FAIL") {
        return "Image is too similar to previous images, retrying with variation";
      }
      if (policy.status === "FAIL") {
        return "Policy violation detected, retrying with different parameters";
      }
      if (semantic.status === "FAIL") {
        return "Semantic relevance check failed, retrying";
      }
      if (visual.status === "FAIL") {
        return "Visual quality check failed, retrying";
      }
      return "Quality check failed, retrying";
    case "FALLBACK":
      return "Maximum retries exceeded, falling back to alternative image source";
    case "REJECT":
      return "Image quality is unacceptable and cannot be recovered";
    default:
      return "Unknown decision";
  }
}
