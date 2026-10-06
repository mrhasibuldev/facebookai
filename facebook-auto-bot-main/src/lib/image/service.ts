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
}

/**
 * Image generation service
 */
export class ImageGenerationService {
  private registry: ImageEngineRegistry;
  private config: ImageServiceConfig;

  constructor(registry: ImageEngineRegistry, config: ImageServiceConfig = {}) {
    this.registry = registry;
    this.config = {
      enableFallback: true,
      defaultSource: "ai",
      enableIntelligence: true,
      ...config,
    };
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

      return {
        url: result.url,
        source: sourceType,
      };
    } catch (error) {
      // Handle fallback if enabled
      if (this.config.enableFallback) {
        const fallbackSource: ImageSource = source === "ai" ? "stock" : "ai";
        const fallbackEngineType = this.sourceToEngineType(fallbackSource);

        try {
          const fallbackRequest = this.buildRequest(prompt, fallbackEngineType);
          const fallbackResult = await this.generateWithEngine(fallbackRequest, fallbackEngineType);

          return {
            url: fallbackResult.url,
            source: fallbackSource,
          };
        } catch {
          // Fallback also failed, throw original error
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

      // Apply variation if seed is provided
      if (this.config.seed !== undefined) {
        visualSpec = generateVariedSpec(visualSpec, this.config.seed);
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
