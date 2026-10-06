/**
 * Image Intelligence Layer
 *
 * This module provides intelligent image generation capabilities by:
 * 1. Understanding topics beyond raw text
 * 2. Creating structured visual specifications
 * 3. Generating diverse visual prompts
 * 4. Building appropriate stock search queries
 *
 * The intelligence layer is provider-independent and can be used with
 * any image engine (AI generation or stock search).
 */

// Topic analysis
export { analyzeTopic } from "./topic-analyzer";
export type { TopicUnderstanding, TopicCategory } from "./topic-analyzer";

// Visual specification
export { createVisualSpec } from "./visual-spec";
export type {
  VisualGenerationSpec,
  CameraPerspective,
  Framing,
  Lighting,
  TimeOfDay,
  Atmosphere,
  ColorMood,
  VisualStyle,
  RealismLevel,
  AspectRatio,
  OutputIntent,
} from "./visual-spec";

// Diversity system
export {
  generateVariationProfile,
  applyVariationToSpec,
  generateVariedSpec,
  generateMultipleVariedSpecs,
} from "./diversity";
export type { VariationProfile } from "./diversity";

// Prompt building
export { buildVisualPrompt, buildSimplifiedPrompt, buildPromptWithContext } from "./prompt-builder";
export type { BuiltPrompt } from "./prompt-builder";

// Stock search
export { createStockSearchSpec, createQuickStockSearchSpec } from "./stock-search";
export type { StockSearchSpec } from "./stock-search";
