/**
 * Image Quality Control
 *
 * Quality control is available as a standalone capability.
 * It can be integrated into the image generation flow in the future.
 *
 * Usage example:
 *
 * ```typescript
 * import { evaluateImageQuality } from "@/lib/image/quality";
 *
 * const blob = await fetch(imageUrl).then(r => r.blob());
 * const qualityResult = await evaluateImageQuality(blob, {
 *   enabled: true,
 *   maxRetries: 2,
 *   minWidth: 400,
 *   minHeight: 400,
 * });
 *
 * if (qualityResult.decision === "ACCEPT") {
 *   // Use the image
 * } else if (qualityResult.decision === "RETRY") {
 *   // Retry with different parameters
 * } else {
 *   // Fallback or reject
 * }
 * ```
 */

export { evaluateImageQuality, evaluateImageQualityWithRetry } from "./quality";
export type { QualityConfig, ImageQualityResult, QualityDecision } from "./quality/types";
