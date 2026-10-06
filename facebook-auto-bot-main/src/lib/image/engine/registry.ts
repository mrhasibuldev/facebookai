/**
 * Image Engine Registry
 * 
 * Manages available image engines and selects the appropriate one
 * for each request.
 * 
 * The registry is designed to be server-safe for Next.js environments.
 * It uses a simple map-based approach rather than complex singletons.
 */

import type {
  ImageEngine,
  ImageEngineType,
  ImageGenerationRequest,
} from "./interface";

/**
 * Simple engine registry implementation
 * 
 * This uses a map-based approach that is safe for Next.js server environments.
 * Each request gets a fresh registry instance.
 */
export class ImageEngineRegistry {
  private engines: Map<ImageEngineType, ImageEngine> = new Map();
  private defaultEngineType: ImageEngineType = "pollinations-ai";

  /**
   * Register a new engine
   */
  register(engine: ImageEngine): void {
    this.engines.set(engine.type, engine);
  }

  /**
   * Unregister an engine
   */
  unregister(engineType: ImageEngineType): void {
    this.engines.delete(engineType);
  }

  /**
   * Get an engine by type
   */
  get(engineType: ImageEngineType): ImageEngine | undefined {
    return this.engines.get(engineType);
  }

  /**
   * Set the default engine
   */
  setDefault(engineType: ImageEngineType): void {
    if (!this.engines.has(engineType)) {
      throw new Error(`Cannot set default to unregistered engine: ${engineType}`);
    }
    this.defaultEngineType = engineType;
  }

  /**
   * Get the default engine
   */
  getDefault(): ImageEngine {
    const engine = this.engines.get(this.defaultEngineType);
    if (!engine) {
      throw new Error(`Default engine ${this.defaultEngineType} is not registered`);
    }
    return engine;
  }

  /**
   * Select the best engine for a request
   * 
   * Selection logic:
   * 1. If request specifies preferredEngine and it's available, use it
   * 2. Otherwise, use the default engine
   */
  select(request: ImageGenerationRequest): ImageEngine {
    if (request.preferredEngine) {
      const engine = this.engines.get(request.preferredEngine);
      if (engine && engine.available && engine.canHandle(request)) {
        return engine;
      }
    }

    return this.getDefault();
  }

  /**
   * List all available engines
   */
  listAvailable(): ImageEngine[] {
    return Array.from(this.engines.values()).filter((engine) => engine.available);
  }

  /**
   * List all registered engines (including unavailable)
   */
  listAll(): ImageEngine[] {
    return Array.from(this.engines.values());
  }
}

/**
 * Create a new registry with the standard engines pre-registered
 * 
 * This is a convenience function for creating a registry with
 * Pollinations and Pexels already registered.
 */
export async function createDefaultRegistry(): Promise<ImageEngineRegistry> {
  const registry = new ImageEngineRegistry();

  // Import engines dynamically to avoid circular dependencies
  const { PollinationsAIEngine } = await import("./providers/pollinations");
  const { PexelsStockEngine } = await import("./providers/pexels");

  registry.register(new PollinationsAIEngine());
  registry.register(new PexelsStockEngine());

  // Set Pollinations as default (matches existing behavior)
  registry.setDefault("pollinations-ai");

  return registry;
}
