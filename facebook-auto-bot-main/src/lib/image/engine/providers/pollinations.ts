/**
 * Pollinations AI Provider Adapter
 *
 * This adapter wraps the existing Pollinations AI image generation
 * to work with the new ImageEngine interface.
 *
 * This allows the application to gradually migrate to the new architecture
 * without breaking the existing Pollinations integration.
 *
 * It now uses the Image Intelligence layer when available to build
 * better visual prompts.
 */

import { randomUUID } from "crypto";
import type {
  ImageEngine,
  ImageGenerationRequest,
  ImageGenerationResult,
  ImageGenerationMetadata,
  ImageEngineType,
} from "../interface";
import { buildVisualPrompt } from "../../intelligence";
import type {
  CameraPerspective,
  Framing,
  Lighting,
  TimeOfDay,
  Atmosphere,
  VisualStyle,
  RealismLevel,
  ColorMood,
  AspectRatio,
  OutputIntent,
} from "../../intelligence";

const PHOTO_STYLE =
  "single subject, professional photograph, natural light, shallow depth of field, high detail, no text, no watermark, no collage, no grid";

const WIDTH = 1200;
const HEIGHT = 1200;

/**
 * Pollinations AI engine implementation
 */
export class PollinationsAIEngine implements ImageEngine {
  readonly type: ImageEngineType = "pollinations-ai";
  readonly name = "Pollinations AI";
  readonly available = true;
  readonly estimatedTimeMs = 5000; // ~5 seconds estimate

  canHandle(_request: ImageGenerationRequest): boolean {
    // Pollinations can handle most requests
    return true;
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const startTime = Date.now();
    const generationId = randomUUID();

    // Build prompt from request
    const prompt = this.buildPrompt(request);
    const seed = Math.floor(Math.random() * 1_000_000);

    // Fetch image from Pollinations
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      `${prompt}, ${PHOTO_STYLE}`
    )}?width=${WIDTH}&height=${HEIGHT}&nologo=true&private=true&noenhance=true&seed=${seed}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      throw new Error(`Pollinations image API ${res.status}`);
    }

    const blob = await res.blob();

    // Upload to Supabase Storage
    const { supabaseAdmin } = await import("@/lib/supabase/server");
    const db = supabaseAdmin();
    const path = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.jpg`;
    const bytes = new Uint8Array(await blob.arrayBuffer());

    const { error } = await db.storage.from("post-images").upload(path, bytes, {
      contentType: blob.type || "image/jpeg",
      upsert: false,
    });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data } = db.storage.from("post-images").getPublicUrl(path);
    const generationTimeMs = Date.now() - startTime;

    const metadata: ImageGenerationMetadata = {
      generationId,
      engine: this.type,
      modelVersion: "openai-fast", // Pollinations uses this model
      seed,
      generationTimeMs,
      timestamp: new Date().toISOString(),
      engineSpecific: {
        provider: "pollinations.ai",
        prompt,
        width: WIDTH,
        height: HEIGHT,
      },
    };

    return {
      url: data.publicUrl,
      engine: this.type,
      metadata,
    };
  }

  private buildPrompt(request: ImageGenerationRequest): string {
    // Check if intelligence data is available (style/composition fields indicate intelligence)
    const hasIntelligence = request.style || request.composition;

    if (hasIntelligence) {
      // Build a visual spec from the request and use the prompt builder
      const visualSpec = {
        topic: request.topic,
        category: "general",
        subject: request.composition?.subject || request.topic,
        subjectType: "scene",
        environment: request.composition?.background,
        background: request.composition?.background,
        cameraPerspective: request.composition?.cameraAngle as CameraPerspective | undefined,
        framing: "medium-shot" as Framing,
        lighting: request.style?.lighting as Lighting | undefined,
        timeOfDay: "morning" as TimeOfDay,
        atmosphere: request.style?.mood as Atmosphere | undefined,
        emotionalTone: request.style?.mood,
        visualStyle: request.style?.style as VisualStyle | undefined,
        realismLevel: "photorealistic" as RealismLevel,
        colorMood: request.style?.color as ColorMood | undefined,
        aspectRatio: (request.technical?.aspectRatio || "1:1") as AspectRatio,
        outputIntent: "social-media" as OutputIntent,
        includeText: request.composition?.includeText || false,
        importantDetails: [] as string[],
        negativeElements: request.negativeConstraints,
      };

      const built = buildVisualPrompt(visualSpec);
      return built.prompt;
    }

    // Fallback to simple prompt construction for backward compatibility
    const parts: string[] = [request.topic];

    if (request.title) {
      parts.push(request.title);
    }

    if (request.description) {
      parts.push(request.description);
    }

    // Add style preferences if specified
    if (request.style) {
      const styleParts: string[] = [];
      if (request.style.mood) styleParts.push(request.style.mood);
      if (request.style.style) styleParts.push(request.style.style);
      if (request.style.color) styleParts.push(request.style.color);
      if (request.style.lighting) styleParts.push(request.style.lighting);
      if (styleParts.length > 0) {
        parts.push(styleParts.join(", "));
      }
    }

    return parts.join(" — ");
  }

  estimateCost(): number | null {
    // Pollinations is free
    return 0;
  }
}
