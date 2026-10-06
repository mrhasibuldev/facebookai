/**
 * Pexels Stock Photo Provider Adapter
 *
 * This adapter wraps the existing Pexels stock photo integration
 * to work with the new ImageEngine interface.
 *
 * It now uses the Image Intelligence layer to build better search queries.
 */

import { randomUUID } from "crypto";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import type {
  ImageEngine,
  ImageGenerationRequest,
  ImageGenerationResult,
  ImageGenerationMetadata,
  ImageEngineType,
} from "../interface";
import type { StockSearchSpec } from "../../intelligence";

const STORAGE_BUCKET = "post-images";

/**
 * Pexels stock photo engine implementation
 */
export class PexelsStockEngine implements ImageEngine {
  readonly type: ImageEngineType = "pexels-stock";
  readonly name = "Pexels Stock Photos";
  readonly available = Boolean(env.pexelsApiKey);
  readonly estimatedTimeMs = 10000; // ~10 seconds estimate (search + download)

  canHandle(_request: ImageGenerationRequest): boolean {
    // Pexels can handle most requests for stock photos
    return this.available;
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const startTime = Date.now();
    const generationId = randomUUID();

    if (!env.pexelsApiKey) {
      throw new Error("PEXELS_API_KEY is not configured");
    }

    // Get stock search spec if available from intelligence
    const stockSpec = this.extractStockSearchSpec(request);

    // Build query (use stock spec if available, otherwise fallback)
    const query = stockSpec?.query || this.buildQuery(request);

    // Use orientation from stock spec if available, otherwise default to square
    const orientation = stockSpec?.orientation || "square";

    // Search for photos
    const searchUrl = `https://api.pexels.com/v1/search?${new URLSearchParams({
      query,
      orientation,
      per_page: "10",
    })}`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: env.pexelsApiKey },
      signal: AbortSignal.timeout(15_000),
    });

    if (!searchRes.ok) {
      throw new Error(`Pexels search failed (${searchRes.status})`);
    }

    const searchResult = await searchRes.json();
    const photos: Array<{ src: { large2x: string; large: string; width: number; height: number }; }> = searchResult.photos ?? [];

    if (photos.length === 0) {
      // Try alternative queries if available
      if (stockSpec?.alternativeQueries && stockSpec.alternativeQueries.length > 0) {
        for (const altQuery of stockSpec.alternativeQueries) {
          const altSearchUrl = `https://api.pexels.com/v1/search?${new URLSearchParams({
            query: altQuery,
            orientation,
            per_page: "10",
          })}`;

          const altSearchRes = await fetch(altSearchUrl, {
            headers: { Authorization: env.pexelsApiKey },
            signal: AbortSignal.timeout(15_000),
          });

          if (altSearchRes.ok) {
            const altSearchResult = await altSearchRes.json();
            const altPhotos: Array<{ src: { large2x: string; large: string; width: number; height: number }; }> = altSearchResult.photos ?? [];
            if (altPhotos.length > 0) {
              return this.downloadAndUpload(altPhotos, startTime, generationId, query, altQuery);
            }
          }
        }
      }
      throw new Error("No stock photos found for this topic");
    }

    return this.downloadAndUpload(photos, startTime, generationId, query, query);
  }

  /**
   * Download selected photo and upload to Supabase
   */
  private async downloadAndUpload(
    photos: Array<{ src: { large2x: string; large: string; width: number; height: number }; }>,
    startTime: number,
    generationId: string,
    originalQuery: string,
    actualQuery: string
  ): Promise<ImageGenerationResult> {
    // Randomly select a photo
    const chosen = photos[Math.floor(Math.random() * photos.length)];
    const imageUrl = chosen.src.large2x ?? chosen.src.large;

    // Download the selected image
    const imageRes = await fetch(imageUrl, {
      signal: AbortSignal.timeout(20_000),
    });

    if (!imageRes.ok) {
      throw new Error("Failed to download chosen stock photo");
    }

    const blob = await imageRes.blob();

    // Upload to Supabase Storage
    const db = supabaseAdmin();
    const path = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.jpg`;
    const bytes = new Uint8Array(await blob.arrayBuffer());

    const { error } = await db.storage.from(STORAGE_BUCKET).upload(path, bytes, {
      contentType: blob.type || "image/jpeg",
      upsert: false,
    });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = db.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    const generationTimeMs = Date.now() - startTime;

    const metadata: ImageGenerationMetadata = {
      generationId,
      engine: this.type,
      modelVersion: "pexels-v1",
      generationTimeMs,
      timestamp: new Date().toISOString(),
      engineSpecific: {
        provider: "pexels",
        query: actualQuery,
        originalQuery,
        sourceUrl: imageUrl,
        width: chosen.src.width,
        height: chosen.src.height,
        totalResults: photos.length,
      },
    };

    return {
      url: publicUrlData.publicUrl,
      engine: this.type,
      metadata,
    };
  }

  /**
   * Extract stock search spec from engine-specific metadata
   */
  private extractStockSearchSpec(request: ImageGenerationRequest): StockSearchSpec | undefined {
    if (request.engineSpecific && typeof request.engineSpecific === "object") {
      const spec = request.engineSpecific as { stockSearchSpec?: StockSearchSpec };
      return spec.stockSearchSpec;
    }
    return undefined;
  }

  /**
   * Build query from request (fallback if no intelligence data)
   */
  private buildQuery(request: ImageGenerationRequest): string {
    // Fallback to simple query construction
    const parts: string[] = [request.topic];

    if (request.title) {
      parts.push(request.title);
    }

    if (request.description) {
      // Extract key words from description (first few words)
      const words = request.description.split(" ").slice(0, 5).join(" ");
      parts.push(words);
    }

    return parts.join(" ");
  }

  estimateCost(): number | null {
    // Pexels is free (with API key)
    return 0;
  }
}
