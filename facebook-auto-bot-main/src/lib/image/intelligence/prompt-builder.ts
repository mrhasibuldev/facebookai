/**
 * Visual Prompt Builder
 *
 * Converts VisualGenerationSpec into provider-neutral visual prompts for AI
 * image generation engines.
 *
 * The prompt builder focuses on:
 * - Topic accuracy
 * - Subject clarity
 * - Visual relevance
 * - Natural composition
 * - Realistic context
 * - Diversity
 * - Appropriate lighting
 * - Appropriate camera/framing
 * - Appropriate environment
 * - Appropriate visual style
 *
 * It avoids unnecessary prompt stuffing and meaningless adjectives.
 */

import type { VisualGenerationSpec } from "./visual-spec";

/**
 * Built prompt result
 */
export interface BuiltPrompt {
  /** The main visual prompt */
  prompt: string;
  /** Negative prompt (if supported by provider) */
  negativePrompt: string;
  /** Metadata about the build */
  metadata: {
    subject: string;
    style: string;
    composition: string;
    lighting: string;
  };
}

/**
 * Build the main subject description
 */
function buildSubjectDescription(spec: VisualGenerationSpec): string {
  const parts: string[] = [];

  // Main subject
  parts.push(spec.subject);

  // Add secondary subjects if present
  if (spec.secondarySubjects && spec.secondarySubjects.length > 0) {
    parts.push("with", spec.secondarySubjects.join(", "));
  }

  // Add action if present
  if (spec.action) {
    parts.push(spec.action);
  }

  return parts.join(" ");
}

/**
 * Build environment and background description
 */
function buildEnvironmentDescription(spec: VisualGenerationSpec): string {
  const parts: string[] = [];

  if (spec.environment) {
    parts.push(spec.environment);
  }

  if (spec.background) {
    parts.push(spec.background);
  }

  return parts.join(", ");
}

/**
 * Build composition and camera description
 */
function buildCompositionDescription(spec: VisualGenerationSpec): string {
  const parts: string[] = [];

  if (spec.framing) {
    parts.push(spec.framing);
  }

  if (spec.cameraPerspective) {
    parts.push(spec.cameraPerspective);
  }

  if (spec.composition) {
    parts.push(spec.composition);
  }

  return parts.join(", ");
}

/**
 * Build lighting description
 */
function buildLightingDescription(spec: VisualGenerationSpec): string {
  const parts: string[] = [];

  if (spec.lighting) {
    parts.push(spec.lighting + " lighting");
  }

  if (spec.timeOfDay) {
    parts.push(spec.timeOfDay);
  }

  return parts.join(", ");
}

/**
 * Build style and atmosphere description
 */
function buildStyleDescription(spec: VisualGenerationSpec): string {
  const parts: string[] = [];

  if (spec.visualStyle) {
    parts.push(spec.visualStyle + " style");
  }

  if (spec.realismLevel) {
    parts.push(spec.realismLevel);
  }

  if (spec.atmosphere) {
    parts.push(spec.atmosphere + " atmosphere");
  }

  if (spec.colorMood) {
    parts.push(spec.colorMood + " colors");
  }

  return parts.join(", ");
}

/**
 * Build important details description
 */
function buildDetailsDescription(spec: VisualGenerationSpec): string {
  if (!spec.importantDetails || spec.importantDetails.length === 0) {
    return "";
  }

  // Take top 3-5 most important details
  const topDetails = spec.importantDetails.slice(0, 5);
  return topDetails.join(", ");
}

/**
 * Build negative prompt
 */
function buildNegativePrompt(spec: VisualGenerationSpec): string {
  const negativeParts: string[] = [];

  // Always avoid these
  negativeParts.push("text", "watermark", "logo", "signature", "collage", "grid", "border", "frame");

  // Add spec-specific negative elements
  if (spec.negativeElements && spec.negativeElements.length > 0) {
    negativeParts.push(...spec.negativeElements);
  }

  // Add generic quality issues to avoid
  negativeParts.push("blurry", "low quality", "distorted", "unnatural", "unrealistic", "bad anatomy");

  // Avoid excessive styling
  negativeParts.push("excessive glow", "neon", "oversaturated", "cartoonish");

  return negativeParts.join(", ");
}

/**
 * Build the complete visual prompt
 *
 * This constructs a natural language prompt that AI image generators
 * can understand. It structures the prompt in a logical order:
 * subject → environment → composition → lighting → style → details
 */
export function buildVisualPrompt(spec: VisualGenerationSpec): BuiltPrompt {
  const parts: string[] = [];

  // 1. Subject (most important)
  const subjectDesc = buildSubjectDescription(spec);
  parts.push(subjectDesc);

  // 2. Environment
  const envDesc = buildEnvironmentDescription(spec);
  if (envDesc) {
    parts.push(envDesc);
  }

  // 3. Composition
  const compDesc = buildCompositionDescription(spec);
  if (compDesc) {
    parts.push(compDesc);
  }

  // 4. Lighting
  const lightDesc = buildLightingDescription(spec);
  if (lightDesc) {
    parts.push(lightDesc);
  }

  // 5. Style
  const styleDesc = buildStyleDescription(spec);
  if (styleDesc) {
    parts.push(styleDesc);
  }

  // 6. Important details
  const detailsDesc = buildDetailsDescription(spec);
  if (detailsDesc) {
    parts.push(detailsDesc);
  }

  // Join with natural separators
  const prompt = parts.join(", ");

  // Build negative prompt
  const negativePrompt = buildNegativePrompt(spec);

  return {
    prompt,
    negativePrompt,
    metadata: {
      subject: subjectDesc,
      style: styleDesc || "standard",
      composition: compDesc || "default",
      lighting: lightDesc || "natural",
    },
  };
}

/**
 * Build a simplified prompt for providers with length limits
 *
 * Some providers have prompt length limits. This version prioritizes
 * the most important elements: subject, environment, and style.
 */
export function buildSimplifiedPrompt(spec: VisualGenerationSpec): string {
  const parts: string[] = [];

  // Subject (always included)
  parts.push(buildSubjectDescription(spec));

  // Environment (high priority)
  const envDesc = buildEnvironmentDescription(spec);
  if (envDesc) {
    parts.push(envDesc);
  }

  // Style (high priority)
  if (spec.visualStyle) {
    parts.push(spec.visualStyle);
  }

  // Lighting (medium priority)
  if (spec.lighting) {
    parts.push(spec.lighting + " lighting");
  }

  return parts.join(", ");
}

/**
 * Build prompt with additional context from title/description
 *
 * This is useful when generated text content is available to enhance
 * the visual prompt with more context.
 */
export function buildPromptWithContext(
  spec: VisualGenerationSpec,
  title?: string,
  _description?: string
): BuiltPrompt {
  // Start with base prompt
  const built = buildVisualPrompt(spec);

  // If title is available, it might add useful context
  if (title && title.length > 0) {
    // Extract key concepts from title (first few meaningful words)
    const titleWords = title.split(/\s+/).filter(w => w.length > 3).slice(0, 3);
    if (titleWords.length > 0) {
      // Prepend title concepts to the prompt for emphasis
      built.prompt = `${titleWords.join(" ")}, ${built.prompt}`;
    }
  }

  // Description is usually too long for image prompts, so we don't include it
  // unless we can extract very brief key phrases (future enhancement)

  return built;
}
