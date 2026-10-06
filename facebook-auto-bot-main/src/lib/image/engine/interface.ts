/**
 * FeedWren Internal AI Image Engine
 * 
 * This module defines the abstraction layer for image generation engines.
 * The goal is to support multiple image generation backends:
 * - Current external providers (Pollinations AI, Pexels)
 * - Future self-hosted models (Stable Diffusion, etc.)
 * - Future custom-trained FeedWren models
 * 
 * The rest of FeedWren should not need to know which engine is being used.
 */

/**
 * Image generation result
 */
export interface ImageGenerationResult {
  /** Public URL of the generated image */
  url: string;
  /** Which engine generated this image */
  engine: ImageEngineType;
  /** Engine-specific metadata for tracking and debugging */
  metadata: ImageGenerationMetadata;
}

/**
 * Metadata for tracking image generation provenance
 */
export interface ImageGenerationMetadata {
  /** Unique ID for this generation request */
  generationId: string;
  /** Which engine was used */
  engine: ImageEngineType;
  /** Engine version/model identifier */
  modelVersion?: string;
  /** Seed used for generation (if applicable) */
  seed?: number;
  /** Time taken to generate (ms) */
  generationTimeMs: number;
  /** Timestamp of generation */
  timestamp: string;
  /** Additional engine-specific data */
  engineSpecific?: Record<string, unknown>;
}

/**
 * Supported image engine types
 */
export type ImageEngineType = 
  | "pollinations-ai"      // Current: Pollinations AI
  | "pexels-stock"         // Current: Pexels stock photos
  | "feedwren-internal"     // Future: Self-hosted FeedWren model
  | "stable-diffusion"      // Future: Self-hosted Stable Diffusion
  | "open-source-model"     // Future: Other open-source models
  | "custom-provider";      // Future: Custom providers

/**
 * Image generation request specification
 *
 * This is a structured way to describe what image should be generated,
 * rather than depending entirely on a single text prompt.
 */
export interface ImageGenerationRequest {
  /** Original topic or user input */
  topic: string;
  /** Generated title (optional, if available) */
  title?: string;
  /** Generated description (optional, if available) */
  description?: string;
  /** Visual style preferences */
  style?: ImageStyleSpec;
  /** Composition preferences */
  composition?: ImageCompositionSpec;
  /** Technical specifications */
  technical?: ImageTechnicalSpec;
  /** Quality level */
  quality?: ImageQualityLevel;
  /** Negative constraints (what to avoid) */
  negativeConstraints?: string[];
  /** Safety constraints */
  safetyConstraints?: SafetyConstraints;
  /** Engine preference (optional, will use default if not specified) */
  preferredEngine?: ImageEngineType;
  /** User ID for tracking */
  userId?: string;
  /** Engine-specific data (for passing intelligence layer data to providers) */
  engineSpecific?: Record<string, unknown>;
}

/**
 * Visual style specification
 */
export interface ImageStyleSpec {
  /** Mood/tone (e.g., "professional", "casual", "dramatic") */
  mood?: string;
  /** Visual style (e.g., "photorealistic", "illustration", "minimalist") */
  style?: string;
  /** Color direction (e.g., "warm", "cool", "vibrant", "muted") */
  color?: string;
  /** Lighting (e.g., "natural", "studio", "dramatic") */
  lighting?: string;
}

/**
 * Composition specification
 */
export interface ImageCompositionSpec {
  /** Subject focus (e.g., "single subject", "group", "scene") */
  subject?: string;
  /** Camera angle (e.g., "eye-level", "bird's-eye", "low-angle") */
  cameraAngle?: string;
  /** Background preference (e.g., "clean", "contextual", "blurred") */
  background?: string;
  /** Whether to include text in image */
  includeText?: boolean;
}

/**
 * Technical specifications
 */
export interface ImageTechnicalSpec {
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Aspect ratio (e.g., "1:1", "16:9", "4:5") */
  aspectRatio?: string;
  /** Format (e.g., "jpeg", "png", "webp") */
  format?: "jpeg" | "png" | "webp";
}

/**
 * Quality level
 */
export type ImageQualityLevel = "fast" | "standard" | "high" | "ultra";

/**
 * Safety constraints
 */
export interface SafetyConstraints {
  /** Block inappropriate content */
  blockNSFW?: boolean;
  /** Block violence/gore */
  blockViolence?: boolean;
  /** Block hate symbols */
  blockHate?: boolean;
}

/**
 * Image engine interface
 * 
 * All image engines must implement this interface.
 * This allows the application to switch engines without changing
 * the calling code.
 */
export interface ImageEngine {
  /** Engine type identifier */
  readonly type: ImageEngineType;
  
  /** Engine name for display */
  readonly name: string;
  
  /** Whether this engine is currently available */
  readonly available: boolean;
  
  /** Estimated generation time in ms (for UI feedback) */
  readonly estimatedTimeMs: number;
  
  /**
   * Generate an image based on the request
   * 
   * @param request - Image generation specification
   * @returns Promise with generation result
   * @throws Error if generation fails
   */
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
  
  /**
   * Validate that this engine can handle the request
   * 
   * @param request - Image generation specification
   * @returns true if this engine can handle the request
   */
  canHandle(request: ImageGenerationRequest): boolean;
  
  /**
   * Get cost estimate (if applicable)
   * 
   * @param request - Image generation specification
   * @returns Cost in USD, or null if not applicable
   */
  estimateCost?(request: ImageGenerationRequest): number | null;
}

/**
 * Engine registry
 * 
 * Manages available image engines and selects the appropriate one
 * for each request.
 */
export interface ImageEngineRegistry {
  /** Register a new engine */
  register(engine: ImageEngine): void;
  
  /** Unregister an engine */
  unregister(engineType: ImageEngineType): void;
  
  /** Get an engine by type */
  get(engineType: ImageEngineType): ImageEngine | undefined;
  
  /** Get the default engine */
  getDefault(): ImageEngine;
  
  /** Select the best engine for a request */
  select(request: ImageGenerationRequest): ImageEngine;
  
  /** List all available engines */
  listAvailable(): ImageEngine[];
}
