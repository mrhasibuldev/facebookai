/**
 * Image Diversity System
 *
 * Ensures that multiple generations of the same topic produce visually diverse
 * images while maintaining topic relevance.
 *
 * Uses controlled, deterministic variation based on a seed rather than random
 * choices that could produce semantically nonsensical results.
 */

import type { VisualGenerationSpec, CameraPerspective, Lighting, TimeOfDay, Atmosphere } from "./visual-spec";

/**
 * Variation profile for controlled diversity
 */
export interface VariationProfile {
  /** Composition variant */
  compositionVariant: string;
  /** Camera angle variant */
  cameraVariant: CameraPerspective;
  /** Environment variant */
  environmentVariant: string;
  /** Lighting variant */
  lightingVariant: Lighting;
  /** Time of day variant */
  timeOfDayVariant: TimeOfDay;
  /** Mood variant */
  moodVariant: string;
  /** Perspective variant */
  perspectiveVariant: string;
  /** Subject distance variant */
  subjectDistance?: string;
  /** Depth of field variant */
  depthOfField?: string;
}

/**
 * Composition families for topic-aware variation
 */
const COMPOSITION_FAMILIES = {
  person: [
    { framing: "close-up" as const, camera: "eye-level" as const, description: "intimate portrait", distance: "close", dof: "shallow" },
    { framing: "medium-shot" as const, camera: "eye-level" as const, description: "engaging interaction", distance: "medium", dof: "medium" },
    { framing: "medium-long-shot" as const, camera: "eye-level" as const, description: "environmental context", distance: "far", dof: "deep" },
    { framing: "medium-shot" as const, camera: "low-angle" as const, description: "empowering perspective", distance: "medium", dof: "shallow" },
    { framing: "medium-shot" as const, camera: "high-angle" as const, description: "contextual overview", distance: "far", dof: "deep" },
    { framing: "extreme-close-up" as const, camera: "eye-level" as const, description: "detail focus", distance: "very close", dof: "very shallow" },
    { framing: "full-body" as const, camera: "eye-level" as const, description: "full figure", distance: "far", dof: "medium" },
  ],
  action: [
    { framing: "medium-shot" as const, camera: "eye-level" as const, description: "dynamic action", distance: "medium", dof: "medium" },
    { framing: "medium-long-shot" as const, camera: "eye-level" as const, description: "action in context", distance: "far", dof: "deep" },
    { framing: "close-up" as const, camera: "eye-level" as const, description: "focused detail", distance: "close", dof: "shallow" },
    { framing: "medium-shot" as const, camera: "low-angle" as const, description: "powerful motion", distance: "medium", dof: "shallow" },
    { framing: "medium-shot" as const, camera: "dutch-angle" as const, description: "dynamic angle", distance: "medium", dof: "medium" },
  ],
  object: [
    { framing: "close-up" as const, camera: "eye-level" as const, description: "product detail", distance: "close", dof: "shallow" },
    { framing: "medium-close-up" as const, camera: "eye-level" as const, description: "product in use", distance: "medium", dof: "medium" },
    { framing: "medium-shot" as const, camera: "eye-level" as const, description: "lifestyle context", distance: "far", dof: "deep" },
    { framing: "close-up" as const, camera: "high-angle" as const, description: "flat lay", distance: "very close", dof: "very shallow" },
    { framing: "medium-shot" as const, camera: "low-angle" as const, description: "dramatic product", distance: "medium", dof: "shallow" },
  ],
  scene: [
    { framing: "long-shot" as const, camera: "eye-level" as const, description: "wide establishing", distance: "very far", dof: "deep" },
    { framing: "medium-long-shot" as const, camera: "eye-level" as const, description: "scene context", distance: "far", dof: "deep" },
    { framing: "long-shot" as const, camera: "high-angle" as const, description: "bird's eye view", distance: "very far", dof: "deep" },
    { framing: "medium-shot" as const, camera: "eye-level" as const, description: "scene detail", distance: "medium", dof: "medium" },
    { framing: "long-shot" as const, camera: "bird-s-eye" as const, description: "aerial view", distance: "very far", dof: "deep" },
  ],
  concept: [
    { framing: "medium-shot" as const, camera: "eye-level" as const, description: "symbolic representation", distance: "medium", dof: "medium" },
    { framing: "close-up" as const, camera: "eye-level" as const, description: "focused symbol", distance: "close", dof: "shallow" },
    { framing: "medium-long-shot" as const, camera: "eye-level" as const, description: "conceptual scene", distance: "far", dof: "deep" },
    { framing: "medium-shot" as const, camera: "low-angle" as const, description: "monumental concept", distance: "medium", dof: "shallow" },
  ],
};

/**
 * Lighting families for variation
 */
const LIGHTING_FAMILIES: Lighting[] = [
  "natural",
  "golden-hour",
  "soft",
  "studio",
  "dramatic",
  "backlit",
  "rim-light",
  "hard",
];

/**
 * Time of day families for variation
 */
const TIME_OF_DAY_FAMILIES: TimeOfDay[] = [
  "morning",
  "golden-hour",
  "afternoon",
  "blue-hour",
  "evening",
  "indoor",
  "night",
];

/**
 * Environment families by category
 */
const ENVIRONMENT_FAMILIES: Record<string, string[]> = {
  fitness: ["gym interior", "outdoor park", "home workout space", "running track", "yoga studio"],
  nutrition: ["bright kitchen", "dining table", "outdoor cafe", "market", "modern kitchen"],
  education: ["library", "classroom", "home office", "study space", "university campus"],
  technology: ["modern office", "home office", "coworking space", "tech lab", "minimal workspace"],
  business: ["corporate office", "meeting room", "modern workspace", "startup office", "home office"],
  travel: ["scenic landscape", "city street", "beach", "mountain view", "historic site"],
  health: ["wellness center", "home setting", "clinic", "spa", "park"],
  lifestyle: ["home interior", "cafe", "park", "city street", "cozy space"],
  productivity: ["organized desk", "home office", "library", "cafe", "minimal workspace"],
  motivation: ["outdoor space", "gym", "studio", "urban setting", "nature"],
  general: ["clean modern space", "neutral background", "outdoor setting", "indoor space", "studio"],
};

/**
 * Mood families for variation
 */
const MOOD_FAMILIES: Record<string, string[]> = {
  positive: ["energetic", "uplifting", "bright", "cheerful", "optimistic"],
  neutral: ["professional", "calm", "balanced", "focused", "composed"],
  negative: ["thoughtful", "serious", "calm", "reflective", "quiet"],
  mixed: ["balanced", "nuanced", "varied", "dynamic", "authentic"],
};

/**
 * Deterministic selection from array based on seed
 */
function selectFromArray<T>(array: T[], seed: number, index: number): T {
  if (array.length === 0) return array[0];
  const selectedIndex = (seed + index) % array.length;
  return array[selectedIndex];
}

/**
 * Generate variation profile based on seed and subject type
 *
 * This ensures deterministic variation - the same seed always produces
 * the same variation profile, but different seeds produce different profiles.
 */
export function generateVariationProfile(
  subjectType: string,
  category: string,
  seed: number
): VariationProfile {
  // Select composition based on subject type
  const compositionFamily = COMPOSITION_FAMILIES[subjectType as keyof typeof COMPOSITION_FAMILIES] || COMPOSITION_FAMILIES.scene;
  const compositionIndex = seed % compositionFamily.length;
  const composition = compositionFamily[compositionIndex];

  // Select lighting
  const lightingVariant = selectFromArray(LIGHTING_FAMILIES, seed, 1);

  // Select time of day
  const timeOfDayVariant = selectFromArray(TIME_OF_DAY_FAMILIES, seed, 2);

  // Select environment based on category
  const environmentFamily = ENVIRONMENT_FAMILIES[category] || ENVIRONMENT_FAMILIES.general;
  const environmentVariant = selectFromArray(environmentFamily, seed, 3);

  // Select mood based on emotional tone (default to neutral if not specified)
  const moodFamily = MOOD_FAMILIES.neutral;
  const moodVariant = selectFromArray(moodFamily, seed, 4);

  // Perspective variant description
  const perspectiveVariants = [
    "standard eye-level view",
    "slightly elevated perspective",
    "ground-level perspective",
    "angled perspective",
    "straight-on view",
  ];
  const perspectiveVariant = selectFromArray(perspectiveVariants, seed, 5);

  return {
    compositionVariant: composition.description,
    cameraVariant: composition.camera,
    environmentVariant,
    lightingVariant,
    timeOfDayVariant,
    moodVariant,
    perspectiveVariant,
  };
}

/**
 * Apply variation profile to visual spec
 *
 * This modifies the visual spec with the variation profile while preserving
 * topic-relevant constraints.
 */
export function applyVariationToSpec(
  spec: VisualGenerationSpec,
  variation: VariationProfile
): VisualGenerationSpec {
  return {
    ...spec,
    // Override with variation while preserving topic constraints
    cameraPerspective: variation.cameraVariant,
    lighting: variation.lightingVariant,
    timeOfDay: variation.timeOfDayVariant,
    environment: variation.environmentVariant,
    // Keep important details but add variation context
    background: `${variation.environmentVariant}, ${variation.perspectiveVariant}`,
    // Update atmosphere with mood
    atmosphere: variation.moodVariant as Atmosphere,
    // Add composition note to important details
    importantDetails: [
      ...(spec.importantDetails || []),
      variation.compositionVariant,
      ...(variation.subjectDistance ? [variation.subjectDistance] : []),
      ...(variation.depthOfField ? [variation.depthOfField] : []),
    ],
  };
}

/**
 * Generate varied visual spec from base spec
 *
 * This is the main entry point for creating diverse visual specifications.
 * It takes a base spec and a seed, then applies controlled variation.
 */
export function generateVariedSpec(
  baseSpec: VisualGenerationSpec,
  seed: number
): VisualGenerationSpec {
  const variation = generateVariationProfile(
    baseSpec.subjectType,
    baseSpec.category,
    seed
  );

  return applyVariationToSpec(baseSpec, variation);
}

/**
 * Generate multiple varied specs for the same topic
 *
 * Useful for testing or when multiple options are needed.
 */
export function generateMultipleVariedSpecs(
  baseSpec: VisualGenerationSpec,
  count: number,
  seedBase: number = 0
): VisualGenerationSpec[] {
  const specs: VisualGenerationSpec[] = [];

  for (let i = 0; i < count; i++) {
    const seed = seedBase + i;
    specs.push(generateVariedSpec(baseSpec, seed));
  }

  return specs;
}
