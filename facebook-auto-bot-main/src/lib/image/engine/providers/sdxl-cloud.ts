/**
 * SDXL Cloud Provider Adapter
 *
 * Integrates cloud-based Stable Diffusion XL inference with FeedWren's
 * Image Engine interface.
 *
 * This provider uses Replicate API for SDXL inference, which provides:
 * - No watermarks or logos
 * - High-quality SDXL 1.0 model
 * - Fast generation (5-10 seconds)
 * - Simple HTTP API
 * - Easy fallback to local inference when GPU hardware is available
 *
 * Architecture designed to be easily switchable to local SDXL inference
 * when GPU hardware (NVIDIA with 8GB+ VRAM) becomes available.
 *
 * Future Path:
 * - Replace HTTP API calls with local inference calls
 * - Same interface, same prompts, same integration
 * - Only the runtime changes (cloud → local)
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

const WIDTH = 1024;
const HEIGHT = 1024;

/**
 * SDXL Cloud engine implementation
 */
export class SDXLCloudEngine implements ImageEngine {
  readonly type: ImageEngineType = "feedwren-internal";
  readonly name = "SDXL Cloud";
  readonly available = this.checkAvailability();
  readonly estimatedTimeMs = 8000; // ~8 seconds estimate

  private apiKey: string;
  private model: string;

  constructor(config?: { apiKey?: string; model?: string }) {
    this.apiKey = config?.apiKey || process.env.REPLICATE_API_KEY || "";
    this.model = config?.model || process.env.REPLICATE_MODEL || "stabilityai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";
  }

  /**
   * Check if SDXL Cloud is available
   */
  private checkAvailability(): boolean {
    // Available if API key is configured
    return !!this.apiKey;
  }

  canHandle(request: ImageGenerationRequest): boolean {
    // SDXL can handle most requests
    return true;
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const startTime = Date.now();
    const generationId = randomUUID();

    // Build prompt from request using intelligence layer
    const prompt = this.buildPrompt(request);
    const negativePrompt = this.buildNegativePrompt(request);
    const seed = Math.floor(Math.random() * 2_147_483_647);

    // Call Replicate API for SDXL inference
    const imageBytes = await this.callReplicateAPI(prompt, negativePrompt, seed);

    // Upload to Supabase Storage
    const { supabaseAdmin } = await import("@/lib/supabase/server");
    const db = supabaseAdmin();
    const path = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.jpg`;
    const bytes = new Uint8Array(await imageBytes.arrayBuffer());

    const { error } = await db.storage.from("post-images").upload(path, bytes, {
      contentType: imageBytes.type || "image/jpeg",
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
      modelVersion: "sdxl-1.0-cloud",
      seed,
      generationTimeMs,
      timestamp: new Date().toISOString(),
      engineSpecific: {
        provider: "replicate",
        model: this.model,
        prompt,
        negativePrompt,
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

  /**
   * Build prompt from request using intelligence layer
   */
  private buildPrompt(request: ImageGenerationRequest): string {
    // Check if intelligence data is available
    const hasIntelligence = request.style || request.composition;

    if (hasIntelligence) {
      // Build visual spec and use prompt builder
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

    // Fallback to simple prompt
    return request.topic;
  }

  /**
   * Build negative prompt
   * Explicitly discourages watermarks, logos, and unwanted text
   */
  private buildNegativePrompt(request: ImageGenerationRequest): string {
    const parts: string[] = [
      "text",
      "watermark",
      "logo",
      "signature",
      "collage",
      "grid",
      "border",
      "frame",
      "blurry",
      "low quality",
      "distorted",
      "unnatural",
      "unrealistic",
      "bad anatomy",
      "brand mark",
      "attribution",
      "caption",
      "UI elements",
      "split screen",
    ];

    // Add spec-specific negative elements
    if (request.negativeConstraints) {
      parts.push(...request.negativeConstraints);
    }

    return parts.join(", ");
  }

  /**
   * Call Replicate API for SDXL inference
   */
  private async callReplicateAPI(
    prompt: string,
    negativePrompt: string,
    seed: number
  ): Promise<Blob> {
    const url = `https://api.replicate.com/v1/predictions`;

    // Create prediction
    const createRes = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: this.model,
        input: {
          prompt,
          negative_prompt: negativePrompt,
          seed,
          width: WIDTH,
          height: HEIGHT,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          scheduler: "DPMSolverMultistep",
        },
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!createRes.ok) {
      const error = await createRes.text();
      throw new Error(`Replicate API error: ${createRes.status} - ${error}`);
    }

    const createData = await createRes.json();
    const predictionId = createData.id;

    // Poll for result
    let prediction = createData;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max wait

    while (prediction.status !== "succeeded" && prediction.status !== "failed" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const pollRes = await fetch(`${url}/${predictionId}`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      if (!pollRes.ok) {
        throw new Error(`Replicate poll error: ${pollRes.status}`);
      }

      prediction = await pollRes.json();
      attempts++;
    }

    if (prediction.status === "failed") {
      throw new Error(`Replicate prediction failed: ${prediction.error}`);
    }

    if (prediction.status !== "succeeded") {
      throw new Error(`Replicate prediction timeout after ${attempts} seconds`);
    }

    // Download image
    const imageUrl = prediction.output[0];
    const imageRes = await fetch(imageUrl, {
      signal: AbortSignal.timeout(30_000),
    });

    if (!imageRes.ok) {
      throw new Error(`Failed to download image: ${imageRes.status}`);
    }

    return imageRes.blob();
  }

  estimateCost(): number | null {
    // Replicate SDXL: ~$0.003 per image
    return 0.003;
  }
}
