/**
 * Visual Generation Specification
 *
 * Transforms TopicUnderstanding into a provider-independent visual specification
 * that guides image generation or stock search.
 *
 * This spec is designed to be provider-agnostic - it describes WHAT should be
 * generated, not HOW a specific provider should do it. Provider adapters are
 * responsible for translating this into their specific syntax.
 */

import type { TopicUnderstanding } from "./topic-analyzer";

/**
 * Camera perspective options
 */
export type CameraPerspective =
  | "eye-level"
  | "low-angle"
  | "high-angle"
  | "bird-s-eye"
  | "worm-s-eye"
  | "dutch-angle"
  | "over-shoulder";

/**
 * Framing options
 */
export type Framing =
  | "close-up"
  | "medium-close-up"
  | "medium-shot"
  | "medium-long-shot"
  | "long-shot"
  | "extreme-close-up"
  | "full-body";

/**
 * Lighting options
 */
export type Lighting =
  | "natural"
  | "golden-hour"
  | "blue-hour"
  | "overcast"
  | "studio"
  | "dramatic"
  | "soft"
  | "hard"
  | "backlit"
  | "rim-light";

/**
 * Time of day
 */
export type TimeOfDay =
  | "morning"
  | "midday"
  | "afternoon"
  | "golden-hour"
  | "blue-hour"
  | "evening"
  | "night"
  | "indoor";

/**
 * Atmosphere/mood
 */
export type Atmosphere =
  | "calm"
  | "energetic"
  | "dramatic"
  | "peaceful"
  | "intense"
  | "warm"
  | "cool"
  | "mysterious"
  | "uplifting"
  | "professional"
  | "balanced";

/**
 * Color mood
 */
export type ColorMood = "warm" | "cool" | "neutral" | "vibrant" | "muted" | "monochrome";

/**
 * Visual style
 */
export type VisualStyle =
  | "photorealistic"
  | "editorial"
  | "documentary"
  | "lifestyle"
  | "cinematic"
  | "product"
  | "educational"
  | "minimal"
  | "artistic"
  | "conceptual";

/**
 * Realism level
 */
export type RealismLevel = "photorealistic" | "stylized" | "illustration" | "minimal";

/**
 * Aspect ratio
 */
export type AspectRatio = "1:1" | "4:5" | "16:9" | "9:16" | "3:2" | "2:3";

/**
 * Output intent
 */
export type OutputIntent = "social-media" | "editorial" | "advertising" | "educational" | "documentary";

/**
 * Visual generation specification
 *
 * This is a provider-independent description of what visual content should be
 * generated. Provider adapters translate this into their specific request format.
 */
export interface VisualGenerationSpec {
  /** Original topic */
  topic: string;
  /** Topic category */
  category: string;

  // Subject
  /** Main subject */
  subject: string;
  /** Secondary subjects (if applicable) */
  secondarySubjects?: string[];
  /** Subject type */
  subjectType: string;

  // Environment
  /** Environment/setting */
  environment?: string;
  /** Background description */
  background?: string;

  // Action
  /** Action or activity */
  action?: string;

  // Composition
  /** Camera perspective */
  cameraPerspective?: CameraPerspective;
  /** Framing */
  framing?: Framing;
  /** Composition style */
  composition?: string;

  // Lighting
  /** Lighting type */
  lighting?: Lighting;
  /** Time of day */
  timeOfDay?: TimeOfDay;

  // Atmosphere
  /** Overall atmosphere */
  atmosphere?: Atmosphere;
  /** Emotional tone */
  emotionalTone?: string;

  // Style
  /** Visual style */
  visualStyle?: VisualStyle;
  /** Realism level */
  realismLevel?: RealismLevel;
  /** Color mood */
  colorMood?: ColorMood;

  // Details
  /** Important details to include */
  importantDetails?: string[];
  /** Elements to avoid */
  negativeElements?: string[];

  // Technical
  /** Aspect ratio */
  aspectRatio?: AspectRatio;
  /** Output intent */
  outputIntent?: OutputIntent;

  // Metadata
  /** Whether text should be in the image */
  includeText?: boolean;
  /** Target audience */
  audience?: string;
}

/**
 * Convert TopicUnderstanding to VisualGenerationSpec
 *
 * This transforms the analyzed topic into a concrete visual specification
 * that can be used by prompt builders and provider adapters.
 */
export function createVisualSpec(understanding: TopicUnderstanding): VisualGenerationSpec {
  const spec: VisualGenerationSpec = {
    topic: understanding.originalTopic,
    category: understanding.category,
    subject: understanding.primarySubject,
    subjectType: understanding.subjectType,
    outputIntent: "social-media",
    aspectRatio: "1:1",
    includeText: false,
  };

  // Add environment based on category
  switch (understanding.category) {
    case "fitness":
      spec.environment = "gym, outdoor park, or fitness studio";
      spec.background = "clean, motivational fitness environment";
      break;
    case "nutrition":
      spec.environment = "kitchen, dining table, or fresh market";
      spec.background = "clean, bright food preparation area";
      break;
    case "education":
      spec.environment = "classroom, library, or study space";
      spec.background = "organized learning environment";
      break;
    case "technology":
      spec.environment = "modern office, tech workspace, or digital environment";
      spec.background = "clean, modern tech setting";
      break;
    case "business":
      spec.environment = "professional office or modern workspace";
      spec.background = "clean, professional business environment";
      break;
    case "travel":
      spec.environment = "scenic destination or travel location";
      spec.background = "beautiful, immersive travel setting";
      break;
    case "health":
      spec.environment = "wellness space, clinic, or home setting";
      spec.background = "calm, clean health-focused environment";
      break;
    case "lifestyle":
      spec.environment = "home, daily life setting";
      spec.background = "authentic, relatable everyday environment";
      break;
    default:
      spec.environment = "relevant setting for the topic";
      spec.background = "appropriate background";
  }

  // Map suggested composition to framing
  switch (understanding.suggestedComposition) {
    case "close-up":
      spec.framing = "close-up";
      spec.cameraPerspective = "eye-level";
      break;
    case "medium-shot":
      spec.framing = "medium-shot";
      spec.cameraPerspective = "eye-level";
      break;
    case "wide-scene":
      spec.framing = "long-shot";
      spec.cameraPerspective = "eye-level";
      break;
    case "environmental":
      spec.framing = "medium-long-shot";
      spec.cameraPerspective = "eye-level";
      break;
    case "action":
      spec.framing = "medium-shot";
      spec.cameraPerspective = "eye-level";
      spec.action = "dynamic, engaging activity";
      break;
  }

  // Set visual style
  spec.visualStyle = understanding.suggestedStyle;
  spec.realismLevel = "photorealistic";

  // Set color mood
  spec.colorMood = understanding.suggestedColorMood;

  // Set lighting based on category
  switch (understanding.category) {
    case "fitness":
    case "lifestyle":
    case "travel":
      spec.lighting = "natural";
      spec.timeOfDay = "golden-hour";
      break;
    case "technology":
    case "business":
      spec.lighting = "studio";
      spec.timeOfDay = "indoor";
      break;
    case "education":
      spec.lighting = "soft";
      spec.timeOfDay = "indoor";
      break;
    default:
      spec.lighting = "natural";
      spec.timeOfDay = "morning";
  }

  // Set atmosphere based on emotional tone
  switch (understanding.emotionalTone) {
    case "positive":
      spec.atmosphere = "uplifting";
      spec.emotionalTone = "positive, energetic";
      break;
    case "negative":
      spec.atmosphere = "calm";
      spec.emotionalTone = "serious, thoughtful";
      break;
    case "neutral":
      spec.atmosphere = "professional";
      spec.emotionalTone = "neutral, informative";
      break;
    case "mixed":
      spec.atmosphere = "balanced";
      spec.emotionalTone = "balanced tone";
      break;
  }

  // Add visual keywords as important details
  spec.importantDetails = understanding.visualKeywords.slice(0, 5);

  // Add forbidden elements
  spec.negativeElements = understanding.forbiddenOrAvoidedElements;

  // Add audience if discernible
  if (understanding.audience) {
    spec.audience = understanding.audience;
  }

  return spec;
}
