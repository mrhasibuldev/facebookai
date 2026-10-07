/**
 * Image Generation Service
 *
 * This is the main entry point for image generation in FeedWren.
 * It provides a unified interface that works with the engine registry
 * and handles provider selection, fallback, and error normalization.
 *
 * The service is designed to be backward compatible with the existing
 * generateImage() function while enabling future engine additions.
 *
 * It now integrates with the Image Intelligence layer to provide
 * topic understanding, visual specification, and diversity.
 */

import type { ImageSource, ImageSourcePref } from "@/lib/types";
import type {
  ImageGenerationRequest,
  ImageGenerationResult,
  ImageEngineType,
} from "./engine/interface";
import { ImageEngineRegistry, createDefaultRegistry } from "./engine/registry";
import { analyzeTopic, createVisualSpec, generateVariedSpec, createStockSearchSpec } from "./intelligence";

/**
 * Service configuration
 */
interface ImageServiceConfig {
  /** Whether fallback is enabled when primary engine fails */
  enableFallback?: boolean;
  /** Default source preference */
  defaultSource?: ImageSourcePref;
  /** Whether to use the intelligence layer for topic understanding */
  enableIntelligence?: boolean;
  /** Seed for deterministic variation (optional) */
  seed?: number;
  /** Whether to auto-generate variation seed from topic */
  enableVariation?: boolean;
}

/**
 * Image generation service
 */
export class ImageGenerationService {
  private registry: ImageEngineRegistry;
  private config: ImageServiceConfig;
  private generationCounter: number = 0;

  constructor(registry: ImageEngineRegistry, config: ImageServiceConfig = {}) {
    this.registry = registry;
    this.config = {
      enableFallback: true,
      defaultSource: "ai",
      enableIntelligence: true,
      enableVariation: true,
      ...config,
    };
  }

  /**
   * Generate a deterministic seed from topic string
   * Uses a simple hash to convert topic to a number, then adds counter for variation
   */
  private generateSeed(topic: string): number {
    // Simple hash of topic string
    let hash = 0;
    for (let i = 0; i < topic.length; i++) {
      const char = topic.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Add timestamp + counter for variation across generations
    const timestamp = Math.floor(Date.now() / 1000); // Seconds
    this.generationCounter = (this.generationCounter + 1) % 100; // Cycle 0-99

    return Math.abs(hash + timestamp + this.generationCounter);
  }

  /**
   * Generate an image based on a topic and source preference
   *
   * This is the main public API that matches the existing generateImage() signature.
   *
   * @param prompt - The topic or prompt for image generation
   * @param pref - Source preference ("ai", "stock", or "mixed")
   * @returns Image generation result with URL and source type
   */
  async generate(
    prompt: string,
    pref: ImageSourcePref = this.config.defaultSource ?? "ai"
  ): Promise<{ url: string; source: ImageSource }> {
    // Determine which source to use
    const source = this.resolveSource(pref);

    // Map source to engine type
    const engineType = this.sourceToEngineType(source);

    // Create generation request with intelligence if enabled
    const request = this.buildRequest(prompt, engineType);

    try {
      // Generate using the selected engine
      const result = await this.generateWithEngine(request, engineType);

      // Map engine type back to source type
      const sourceType = this.engineTypeToSource(result.engine);

      // Log successful generation
      console.log(`[ImageService] Generated image using ${result.engine} in ${result.metadata.generationTimeMs}ms`);

      return {
        url: result.url,
        source: sourceType,
      };
    } catch (error) {
      // Handle fallback if enabled
      if (this.config.enableFallback) {
        const fallbackSource: ImageSource = source === "ai" ? "stock" : "ai";
        const fallbackEngineType = this.sourceToEngineType(fallbackSource);

        console.warn(`[ImageService] Primary engine ${engineType} failed, falling back to ${fallbackEngineType}`);

        try {
          const fallbackRequest = this.buildRequest(prompt, fallbackEngineType);
          const fallbackResult = await this.generateWithEngine(fallbackRequest, fallbackEngineType);

          console.log(`[ImageService] Fallback generation succeeded using ${fallbackResult.engine}`);

          return {
            url: fallbackResult.url,
            source: fallbackSource,
          };
        } catch {
          // Fallback also failed, throw original error
          console.error(`[ImageService] Fallback engine ${fallbackEngineType} also failed`);
          throw error instanceof Error ? error : new Error("Image generation failed");
        }
      }

      throw error instanceof Error ? error : new Error("Image generation failed");
    }
  }

  /**
   * Build an image generation request with intelligence
   */
  private buildRequest(prompt: string, engineType: ImageEngineType): ImageGenerationRequest {
    const request: ImageGenerationRequest = {
      topic: prompt,
      preferredEngine: engineType,
    };

    // If intelligence is disabled, return basic request
    if (!this.config.enableIntelligence) {
      return request;
    }

    try {
      // Analyze topic
      const understanding = analyzeTopic(prompt);

      // Create visual spec
      let visualSpec = createVisualSpec(understanding);

      // Apply variation if:
      // 1. Explicit seed is provided, OR
      // 2. Variation is enabled (auto-generate seed from topic)
      const seed = this.config.seed !== undefined
        ? this.config.seed
        : this.config.enableVariation
          ? this.generateSeed(prompt)
          : undefined;

      if (seed !== undefined) {
        visualSpec = generateVariedSpec(visualSpec, seed);
      }

      // Enhance request with visual spec data
      request.style = {
        mood: visualSpec.emotionalTone,
        style: visualSpec.visualStyle,
        color: visualSpec.colorMood,
        lighting: visualSpec.lighting,
      };

      request.composition = {
        subject: visualSpec.subject,
        cameraAngle: visualSpec.cameraPerspective,
        background: visualSpec.background,
        includeText: visualSpec.includeText,
      };

      request.technical = {
        aspectRatio: visualSpec.aspectRatio,
      };

      request.negativeConstraints = visualSpec.negativeElements;

      // For stock engines, add stock search spec to engine-specific metadata
      if (engineType === "pexels-stock") {
        const stockSpec = createStockSearchSpec(visualSpec);
        request.engineSpecific = {
          stockSearchSpec: stockSpec,
        };
      }

      return request;
    } catch (error) {
      // If intelligence fails, fall back to basic request
      console.warn("[ImageService] Intelligence layer failed, using basic request:", error);
      return request;
    }
  }

  /**
   * Generate using a specific engine
   */
  private async generateWithEngine(
    request: ImageGenerationRequest,
    engineType: ImageEngineType
  ): Promise<ImageGenerationResult> {
    const engine = this.registry.get(engineType);
    
    if (!engine) {
      throw new Error(`Engine ${engineType} is not registered`);
    }
    
    if (!engine.available) {
      throw new Error(`Engine ${engineType} is not available`);
    }
    
    if (!engine.canHandle(request)) {
      throw new Error(`Engine ${engineType} cannot handle this request`);
    }
    
    return engine.generate(request);
  }

  /**
   * Resolve source preference to actual source
   * Matches existing resolveImageSource() behavior
   */
  private resolveSource(pref: ImageSourcePref): ImageSource {
    if (pref === "mixed") {
      return Math.random() < 0.5 ? "ai" : "stock";
    }
    return pref;
  }

  /**
   * Map source type to engine type
   */
  private sourceToEngineType(source: ImageSource): ImageEngineType {
    switch (source) {
      case "ai":
        // Use SDXL Cloud if available, otherwise Pollinations
        if (this.registry.get("feedwren-internal")?.available) {
          return "feedwren-internal";
        }
        return "pollinations-ai";
      case "stock":
        return "pexels-stock";
      default:
        return "pollinations-ai";
    }
  }

  /**
   * Map engine type back to source type
   */
  private engineTypeToSource(engineType: ImageEngineType): ImageSource {
    switch (engineType) {
      case "pollinations-ai":
        return "ai";
      case "pexels-stock":
        return "stock";
      case "feedwren-internal":
        return "ai"; // SDXL Cloud is an AI source
      default:
        // For future engines, default to AI
        return "ai";
    }
  }

  /**
   * Get the registry (for advanced use cases)
   */
  getRegistry(): ImageEngineRegistry {
    return this.registry;
  }
}

/**
 * Create a default image generation service
 * 
 * This is a convenience function that creates a service with
 * the standard registry and default configuration.
 */
export async function createDefaultImageService(
  config?: ImageServiceConfig
): Promise<ImageGenerationService> {
  const registry = await createDefaultRegistry();
  return new ImageGenerationService(registry, config);
}
