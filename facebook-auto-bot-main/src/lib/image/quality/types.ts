/**
 * Image Quality Control Types
 *
 * Normalized quality result model for image evaluation.
 * Separates technical, semantic, visual, and policy concerns.
 */

/**
 * Quality decision outcomes
 */
export type QualityDecision = "ACCEPT" | "RETRY" | "FALLBACK" | "REJECT";

/**
 * Validation result status
 */
export type ValidationStatus = "PASS" | "WARN" | "FAIL" | "NOT_EVALUATED";

/**
 * Technical validation result
 */
export interface TechnicalValidationResult {
  /** Overall status */
  status: ValidationStatus;
  /** Image exists and is downloadable */
  imageExists: boolean;
  /** MIME type is valid image type */
  validMimeType: boolean;
  /** Actual MIME type detected */
  mimeType?: string;
  /** File is actually an image (not corrupted) */
  isImage: boolean;
  /** Image dimensions */
  dimensions?: {
    width: number;
    height: number;
  };
  /** File size in bytes */
  fileSize?: number;
  /** Minimum width check */
  minWidthCheck: ValidationStatus;
  /** Minimum height check */
  minHeightCheck: ValidationStatus;
  /** Aspect ratio check */
  aspectRatioCheck: ValidationStatus;
  /** Issues found */
  issues: string[];
  /** Warnings found */
  warnings: string[];
}

/**
 * Semantic validation result
 *
 * Evaluates whether the image actually represents the requested topic.
 * This is currently NOT EVALUATED as it requires AI/CV.
 */
export interface SemanticValidationResult {
  /** Overall status */
  status: ValidationStatus;
  /** Relevance score (0-1) if evaluated */
  relevanceScore?: number;
  /** Confidence in the evaluation */
  confidence?: number;
  /** Matched concepts from topic */
  matchedConcepts?: string[];
  /** Missing concepts from topic */
  missingConcepts?: string[];
  /** Contradictions found */
  contradictions?: string[];
  /** Issues found */
  issues: string[];
  /** Warnings found */
  warnings: string[];
}

/**
 * Visual quality validation result
 *
 * Evaluates visual quality characteristics.
 */
export interface VisualValidationResult {
  /** Overall status */
  status: ValidationStatus;
  /** Image is too blurry */
  tooBlurry: ValidationStatus;
  /** Image is too dark */
  tooDark: ValidationStatus;
  /** Image is too bright */
  tooBright: ValidationStatus;
  /** Image is blank/empty */
  isBlank: ValidationStatus;
  /** Image has low information content */
  lowInformation: ValidationStatus;
  /** Obvious rendering artifacts */
  hasArtifacts: ValidationStatus;
  /** Issues found */
  issues: string[];
  /** Warnings found */
  warnings: string[];
}

/**
 * Policy validation result
 *
 * Evaluates policy compliance (watermarks, branding, text, etc.).
 */
export interface PolicyValidationResult {
  /** Overall status */
  status: ValidationStatus;
  /** Obvious watermark detected */
  hasWatermark: ValidationStatus;
  /** Provider branding detected */
  hasBranding: ValidationStatus;
  /** Excessive text detected */
  hasExcessiveText: ValidationStatus;
  /** Unwanted logo detected */
  hasUnwantedLogo: ValidationStatus;
  /** Third-party branding detected */
  hasThirdPartyBranding: ValidationStatus;
  /** Issues found */
  issues: string[];
  /** Warnings found */
  warnings: string[];
}

/**
 * Repetition validation result
 *
 * Evaluates whether this image is too similar to previous images.
 */
export interface RepetitionValidationResult {
  /** Overall status */
  status: ValidationStatus;
  /** Image hash (for future comparison) */
  imageHash?: string;
  /** Prompt hash (for future comparison) */
  promptHash?: string;
  /** Visual spec hash (for future comparison) */
  visualSpecHash?: string;
  /** Seed used (for future comparison) */
  seed?: number;
  /** Similar to recent images */
  isSimilarToRecent: ValidationStatus;
  /** Similarity score if evaluated */
  similarityScore?: number;
  /** Issues found */
  issues: string[];
  /** Warnings found */
  warnings: string[];
}

/**
 * Complete quality evaluation result
 */
export interface ImageQualityResult {
  /** Final decision */
  decision: QualityDecision;
  /** Reason for decision */
  reason: string;
  /** Technical validation */
  technical: TechnicalValidationResult;
  /** Semantic validation */
  semantic: SemanticValidationResult;
  /** Visual validation */
  visual: VisualValidationResult;
  /** Policy validation */
  policy: PolicyValidationResult;
  /** Repetition validation */
  repetition: RepetitionValidationResult;
  /** All issues combined */
  allIssues: string[];
  /** All warnings combined */
  allWarnings: string[];
  /** Overall score (0-1) if applicable */
  score?: number;
  /** Evaluator version */
  evaluatorVersion: string;
  /** Evaluation timestamp */
  timestamp: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Quality evaluation configuration
 */
export interface QualityConfig {
  /** Minimum width in pixels */
  minWidth?: number;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Enable quality control */
  enabled?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
}
