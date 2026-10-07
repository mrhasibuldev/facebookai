# Custom AI Image Model Architecture for FeedWren

**Project:** FeedWren (facebook-auto-bot-main)
**Date:** 2026-10-06
**Goal:** Design and implement a custom AI image model pipeline (Image Brain + Model) for FeedWren
**Approach:** Pragmatic start with fine-tuning, long-term path to fully custom model

---

## Executive Summary

FeedWren currently uses external image generation providers (Pollinations AI and Pexels Stock) through a sophisticated Image Intelligence layer. This document proposes a practical path toward building our own AI image model pipeline, starting with fine-tuning existing open-source models before moving to a fully custom solution.

**Proposed Path:**
1. **Phase 1 (Immediate):** Integrate Stable Diffusion XL (SDXL) locally
2. **Phase 2 (Short-term):** Fine-tune SDXL on FeedWren-specific dataset
3. **Phase 3 (Medium-term):** Train custom LoRA adapters for Facebook/social media
4. **Phase 4 (Long-term):** Consider full model training with sufficient resources

**Key Principle:** Start with what works (fine-tuning), iterate based on results, scale only when justified.

---

## A. Current Image Generation Flow Mapping

### Complete Flow Diagram

```
USER enters topic in /dashboard/generate
↓
Frontend: src/app/dashboard/generate/page.tsx
↓
POST /api/generate/image with { prompt, source }
↓
API Route: src/app/api/[...path]/route.ts
↓
Calls generateImage(prompt, source) from src/lib/ai/image.ts
↓
USE_NEW_ENGINE_SERVICE = true
↓
ImageService.createDefaultImageService()
↓
ImageEngineRegistry with registered engines:
  - PollinationsAIEngine (pollinations-ai)
  - PexelsStockEngine (pexels-stock)
↓
ImageService.generate(prompt, pref)
↓
1. Resolve source preference (ai/stock/mixed)
2. Map to engine type (pollinations-ai / pexels-stock)
3. Build request with intelligence:
   a. analyzeTopic(prompt) → TopicUnderstanding
   b. createVisualSpec(understanding) → VisualGenerationSpec
   c. generateVariedSpec(spec, seed) → VariationProfile
   d. buildVisualPrompt(spec) → prompt string
↓
EngineRegistry.select(request) → engine
↓
Engine.generate(request)
↓
PROVIDER-SPECIFIC FLOW:

Pollinations AI:
- Build prompt from request
- Generate seed for variation
- Call: https://image.pollinations.ai/prompt/{prompt}?width=1200&height=1200&seed={seed}
- Fetch image blob
- Upload to Supabase Storage (post-images bucket)
- Return { url, source: "ai" }

Pexels Stock:
- Build stock search spec from visual spec
- Call: https://api.pexels.com/v1/search?query={query}&orientation=square&per_page=10
- Random selection from results
- Download chosen photo
- Upload to Supabase Storage
- Return { url, source: "stock" }
↓
Return { url, source } to API
↓
API returns JSON to frontend
↓
Frontend displays image in generate page
↓
User can edit, save, schedule, or publish to Facebook
```

### Current Architecture Components

#### 1. Entry Points

**Manual Generation:**
- `src/app/dashboard/generate/page.tsx` - User triggers generation
- POST `/api/generate/image` - API endpoint

**Autopilot Generation:**
- `src/lib/autopilot.ts` - Automatic post generation
- Calls `generateImage()` directly

#### 2. Image Intelligence Layer

**Location:** `src/lib/image/intelligence/`

**Components:**
- `topic-analyzer.ts` - Topic categorization and understanding
- `visual-spec.ts` - Structured visual specification
- `diversity.ts` - Variation generation (composition, lighting, environment)
- `prompt-builder.ts` - Prompt construction from visual spec
- `stock-search.ts` - Stock photo search query building

**Output:** Structured prompt with composition, lighting, style, camera angle, environment

#### 3. Image Service Layer

**Location:** `src/lib/image/service.ts`

**Responsibilities:**
- Orchestrates intelligence layer
- Manages engine selection
- Handles fallback between providers
- Applies variation for diversity

**Configuration:**
- `enableFallback` - Switch between providers on failure
- `defaultSource` - AI, stock, or mixed
- `enableIntelligence` - Use intelligence layer
- `enableVariation` - Apply diversity system (NEWLY ACTIVATED)
- `seed` - Deterministic variation seed

#### 4. Engine Registry

**Location:** `src/lib/image/engine/registry.ts`

**Registered Engines:**
- `pollinations-ai` - External AI generation
- `pexels-stock` - External stock photos

**Future Slots (Reserved):**
- `feedwren-internal` - Self-hosted FeedWren model
- `stable-diffusion` - Self-hosted Stable Diffusion
- `open-source-model` - Other open-source models
- `custom-provider` - Custom providers

#### 5. Provider Adapters

**Location:** `src/lib/image/engine/providers/`

**Current Implementations:**
- `pollinations.ts` - Pollinations AI integration
- `pexels.ts` - Pexels Stock integration

**Interface:** All implement `ImageEngine` interface from `interface.ts`

#### 6. Storage Layer

**Bucket:** `post-images` in Supabase Storage
**Path Pattern:** `{date}/{uuid}.jpg`
**Public:** Yes (for Facebook to fetch)

#### 7. Quality Control (Available but Not Integrated)

**Location:** `src/lib/image/quality/`

**Components:**
- `technical.ts` - Dimension, format, corruption validation
- `semantic.ts` - Subject clarity, relevance validation
- `visual.ts` - Lighting, composition, quality validation
- `policy.ts` - Watermark, text, unsafe content validation
- `repetition.ts` - Similarity detection
- `decision.ts` - Accept/retry/reject logic

**Status:** Available as standalone capability, not currently used in main flow

### Current Dependencies

**External Providers:**
- Pollinations AI (free, no API key)
- Pexels (requires PEXELS_API_KEY)

**No ML Dependencies:**
- No PyTorch/TensorFlow
- No model files
- No GPU compute requirements
- No training infrastructure

### Current Limitations

1. **Dependence on External Providers:**
   - Pollinations AI: Free community service, no uptime guarantee
   - Pexels: Rate-limited, requires API key
   - No control over model updates or degradation

2. **No Customization:**
   - Cannot fine-tune for Facebook/social media style
   - Cannot train on brand-specific content
   - Cannot optimize for FeedWren's use cases

3. **Cost/Scale Limitations:**
   - Pexels has rate limits
   - External providers may introduce costs later
   - No cost control over generation volume

4. **Privacy Concerns:**
   - Topics sent to external providers
   - No control over data retention
   - Potential IP concerns with generated content

---

## B. Proposed Architecture for Custom Model

### Architecture Principles

1. **Incremental Progress:** Start with local inference, add fine-tuning, then full training
2. **Provider Independence:** Use engine registry to switch providers seamlessly
3. **Backward Compatibility:** Keep external providers as fallback during transition
4. **Local-First:** Develop and test locally before any cloud deployment
5. **Cost-Aware:** Monitor GPU costs, optimize for efficiency

### Phase 1: Local Stable Diffusion Integration (Immediate)

**Goal:** Replace Pollinations AI with local Stable Diffusion XL inference

**Model Choice:** Stable Diffusion XL (SDXL) 1.0
- Open-source, permissive license
- State-of-the-art quality (1024x1024 native)
- Good community support
- Multiple inference backends (Automatic1111, ComfyUI, direct PyTorch)

**Architecture:**

```
NEW ENGINE: FeedWrenLocalSDXLEngine
↓
Implements ImageEngine interface
↓
Local Inference Options:
  Option A: Automatic1111 WebUI API (easiest start)
  Option B: ComfyUI API (more control)
  Option C: Direct PyTorch inference (most efficient)
↓
Integration Points:
  - src/lib/image/engine/providers/sdxl-local.ts (new provider)
  - Register in createDefaultRegistry()
  - Add environment configuration
↓
Flow:
  Image Intelligence → Structured Prompt
  → SDXL Engine → Local Inference
  → Image Bytes → Supabase Storage
  → Return URL
```

**Implementation Steps:**

1. **Install SDXL Locally:**
   ```bash
   # Option A: Automatic1111 (easiest)
   git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui
   cd stable-diffusion-webui
   # Install dependencies and run
   webui.sh --api --listen 127.0.0.1:7860
   ```

2. **Create Provider Adapter:**
   ```typescript
   // src/lib/image/engine/providers/sdxl-local.ts
   export class SDXLLocalEngine implements ImageEngine {
     readonly type: ImageEngineType = "stable-diffusion";
     readonly name = "SDXL Local";
     readonly available = true;
     readonly estimatedTimeMs = 8000;

     async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
       // Call local SDXL API
       // Use prompt from intelligence layer
       // Upload to Supabase
       // Return result
     }
   }
   ```

3. **Environment Configuration:**
   ```env
   # .env.local
   SDXL_API_URL=http://127.0.0.1:7860
   SDXL_ENABLED=true
   ```

4. **Register Engine:**
   ```typescript
   // src/lib/image/engine/registry.ts
   if (env.sdxlEnabled) {
     registry.register(new SDXLLocalEngine());
     registry.setDefault("stable-diffusion");
   }
   ```

**Compute Requirements:**
- GPU: NVIDIA RTX 3060 (12GB VRAM) or better
- RAM: 16GB+
- Storage: 50GB+ for model files
- OS: Windows, Linux, or macOS (with M1/M2 for Metal acceleration)

**Estimated Costs:**
- If using existing GPU: $0 (software only)
- If renting GPU (e.g., RunPod, Lambda Labs): $0.40-$1.00/hour
- Per generation: ~2-5 seconds on RTX 3060, ~8-12 seconds on cloud GPU

**Testing Steps:**
1. Start local SDXL instance
2. Test API with curl or Postman
3. Integrate provider adapter
4. Generate test images with known prompts
5. Compare quality with Pollinations
6. Benchmark generation time
7. Test fallback to Pollinations if SDXL fails

### Phase 2: Fine-Tuning SDXL (Short-term)

**Goal:** Fine-tune SDXL on FeedWren-specific dataset for better social media results

**Dataset Requirements:**

**Target Domain:** Facebook/social media posts
- High-quality stock photos (Unsplash, Pexels, Pixabay)
- Social media marketing images
- Business/tech/lifestyle photography
- 10,000-50,000 images for meaningful fine-tuning

**Dataset Categories (aligned with FeedWren categories):**
- Health/fitness: People exercising, healthy food, wellness
- Business/tech: Office scenes, technology, meetings
- Lifestyle: Daily life, home, routines
- Travel: Destinations, landscapes, experiences
- Education: Learning, classrooms, study spaces
- Nutrition: Food, cooking, meals
- And other FeedWren categories...

**Data Collection Strategy:**
1. **Download from Free Sources:**
   - Unsplash API (free, high quality)
   - Pexels API (already have API key)
   - Pixabay API (free)
   - Target: 5,000-10,000 images per category

2. **Labeling:**
   - Use category labels from FeedWren's topic analyzer
   - Add caption/description for each image
   - Use CLIP or BLIP for auto-captioning if needed

3. **Dataset Format:**
   ```
   dataset/
   ├── fitness/
   │   ├── image_001.jpg
   │   ├── image_001.txt (caption)
   │   ├── image_002.jpg
   │   └── ...
   ├── business/
   │   └── ...
   └── metadata.json (category labels)
   ```

**Fine-Tuning Approach:**

**Option A: LoRA (Low-Rank Adaptation) - RECOMMENDED**
- Pros: Lightweight (100-500MB), fast training (1-3 hours), easy to swap
- Cons: Slightly lower quality than full fine-tune
- Cost: $10-50 on cloud GPU, free on local GPU
- Training time: 1-3 hours on RTX 3090, 4-8 hours on RTX 3060

**Option B: DreamBooth (Full Fine-Tune)**
- Pros: Higher quality, more customization
- Cons: Heavy (2-5GB), slower training (8-24 hours)
- Cost: $50-200 on cloud GPU
- Training time: 8-24 hours on RTX 3090

**Recommended:** Start with LoRA, upgrade to DreamBooth if needed

**Training Tools:**
- Kohya_ss (GUI for fine-tuning)
- Hugging Face diffusers (Python library)
- Automatic1111 training extensions

**LoRA Training Example (Kohya_ss):**
```bash
# Install Kohya_ss
git clone https://github.com/kohya-ss/sd-scripts
cd sd-scripts
pip install -r requirements.txt

# Train LoRA
python train_network.py \
  --pretrained_model_name_or_path="stabilityai/stable-diffusion-xl-base-1.0" \
  --dataset_config="dataset_config.toml" \
  --output_dir="output/feedwren_lora" \
  --output_name="feedwren_social" \
  --save_model_as=safetensors \
  --prior_loss_weight=1.0 \
  --max_train_epochs=10 \
  --learning_rate=1e-4 \
  --lr_scheduler="cosine" \
  --network_dim=128 \
  --network_alpha=128
```

**Dataset Config (dataset_config.toml):**
```toml
[[datasets]]
subset_name = "feedwren_social"
image_dir = "dataset"
caption_extension = ".txt"
num_repeats = 5
shuffle_caption = true
```

**Integration After Fine-Tuning:**
```typescript
// src/lib/image/engine/providers/sdxl-local.ts
const LoRA_PATH = path.join(process.cwd(), "models/feedwren_social.safetensors");

async generate(request: ImageGenerationRequest) {
  const payload = {
    prompt: builtPrompt,
    negative_prompt: negativePrompt,
    sampler_name: "DPM++ 2M Karras",
    steps: 30,
    cfg_scale: 7.5,
    width: 1024,
    height: 1024,
    alwayson_scripts: {
      additional_networks: {
        args: [
          {
            model: LoRA_PATH,
            weight: 0.8,
          }
        ]
      }
    }
  };
  // Call SDXL API with LoRA
}
```

**Compute Requirements for Fine-Tuning:**
- GPU: NVIDIA RTX 3090 (24GB VRAM) or cloud equivalent
- RAM: 32GB+
- Storage: 100GB+ for dataset and checkpoints
- Training time: 1-3 hours (LoRA), 8-24 hours (DreamBooth)

**Estimated Costs:**
- Local GPU (if owned): $0 (electricity only)
- Cloud GPU (RunPod/Lambda): $50-200 for LoRA, $200-500 for DreamBooth
- Data storage: $5-20/month (if using cloud storage)

**Testing Steps:**
1. Train LoRA on small subset (1,000 images) to validate pipeline
2. Generate test images with same prompts before/after fine-tuning
3. Compare quality, relevance, and FeedWren-specific style
4. A/B test with users (if possible)
5. Iterate on dataset and hyperparameters
6. Full training on complete dataset
7. Deploy to production (local or cloud)

### Phase 3: Custom LoRA Adapters (Medium-term)

**Goal:** Train multiple specialized LoRAs for different FeedWren categories

**LoRA Strategy:**
- `feedwren_fitness.lora` - Fitness and health images
- `feedwren_business.lora` - Business and tech images
- `feedwren_lifestyle.lora` - Lifestyle and daily life
- `feedwren_travel.lora` - Travel and destinations
- `feedwren_nutrition.lora` - Food and nutrition

**Selection Logic:**
```typescript
// src/lib/image/service.ts
function selectLoRA(category: string): string {
  const loraMap = {
    fitness: "feedwren_fitness.lora",
    business: "feedwren_business.lora",
    lifestyle: "feedwren_lifestyle.lora",
    travel: "feedwren_travel.lora",
    nutrition: "feedwren_nutrition.lora",
  };
  return loraMap[category] || "feedwren_social.lora";
}
```

**Benefits:**
- More specialized results per category
- Smaller models (easier to manage)
- Can update individual categories without retraining all
- Better performance (faster loading)

**Cost:**
- Each LoRA: $10-50 on cloud GPU
- Total: $50-250 for 5 specialized LoRAs

### Phase 4: Full Model Training (Long-term)

**Goal:** Train a completely custom model when fine-tuning is insufficient

**When to Consider:**
- LoRA fine-tuning doesn't produce desired quality
- Need fundamental changes to model architecture
- Have significant budget and compute resources
- Want complete control over model behavior

**Approach:**
- Start from SDXL base
- Use larger dataset (100,000+ images)
- Full fine-tuning or train from scratch (if budget allows)
- Requires significant expertise in ML training

**Compute Requirements:**
- GPU: Multiple A100s (80GB each) or H100s
- Training time: Days to weeks
- Cost: $10,000-100,000+

**Recommendation:** Only pursue this if Phase 2-3 are insufficient and budget allows

---

## C. Implementation Plan (Step-by-Step)

### Step 1: Environment Setup (Local Development)

**Prerequisites:**
- Python 3.10+
- NVIDIA GPU with CUDA support (recommended) or Apple M1/M2
- 16GB+ RAM
- 50GB+ free storage

**Install Local SDXL:**

**Option A: Automatic1111 (Easiest)**
```bash
# Clone repository
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui
cd stable-diffusion-webui

# Install and run (Windows)
webui-user.bat --api --listen 127.0.0.1:7860

# Or (Linux/Mac)
./webui.sh --api --listen 127.0.0.1:7860
```

**Option B: ComfyUI (More Control)**
```bash
# Clone repository
git clone https://github.com/comfyanonymous/ComfyUI
cd ComfyUI

# Install dependencies
pip install -r requirements.txt

# Run with API
python main.py --listen 127.0.0.1:8188
```

**Option C: Direct PyTorch (Most Efficient)**
```bash
# Install PyTorch with CUDA
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install diffusers
pip install diffusers transformers accelerate safetensors

# Download SDXL model
from diffusers import StableDiffusionXLPipeline
pipe = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    torch_dtype=torch.float16
)
pipe.to("cuda")
```

**Verify Installation:**
```bash
# Test with curl (Automatic1111)
curl -X POST http://127.0.0.1:7860/sdapi/v1/txt2img \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over the ocean",
    "steps": 20,
    "width": 1024,
    "height": 1024
  }'
```

### Step 2: Create Provider Adapter

**File:** `src/lib/image/engine/providers/sdxl-local.ts`

```typescript
/**
 * SDXL Local Provider Adapter
 *
 * Integrates local Stable Diffusion XL inference with FeedWren's
 * Image Engine interface.
 *
 * Supports Automatic1111, ComfyUI, or custom inference backends.
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
 * SDXL Local engine implementation
 */
export class SDXLLocalEngine implements ImageEngine {
  readonly type: ImageEngineType = "stable-diffusion";
  readonly name = "SDXL Local";
  readonly available = this.checkAvailability();
  readonly estimatedTimeMs = 8000; // ~8 seconds estimate

  private apiUrl: string;
  private apiKey?: string;
  private loraPath?: string;

  constructor(config?: { apiUrl?: string; apiKey?: string; loraPath?: string }) {
    this.apiUrl = config?.apiUrl || process.env.SDXL_API_URL || "http://127.0.0.1:7860";
    this.apiKey = config?.apiKey || process.env.SDXL_API_KEY;
    this.loraPath = config?.loraPath || process.env.SDXL_LORA_PATH;
  }

  /**
   * Check if local SDXL instance is available
   */
  private checkAvailability(): boolean {
    // In production, could add health check
    // For now, assume available if URL is configured
    return !!this.apiUrl;
  }

  canHandle(_request: ImageGenerationRequest): boolean {
    // SDXL can handle most requests
    return true;
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const startTime = Date.now();
    const generationId = randomUUID();

    // Build prompt from request
    const prompt = this.buildPrompt(request);
    const negativePrompt = this.buildNegativePrompt(request);
    const seed = Math.floor(Math.random() * 2_147_483_647);

    // Call local SDXL API
    const imageBytes = await this.callSDXLAPI(prompt, negativePrompt, seed);

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
      modelVersion: "sdxl-1.0",
      seed,
      generationTimeMs,
      timestamp: new Date().toISOString(),
      engineSpecific: {
        provider: "sdxl-local",
        prompt,
        negativePrompt,
        width: WIDTH,
        height: HEIGHT,
        loraPath: this.loraPath,
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
    ];

    if (request.negativeConstraints) {
      parts.push(...request.negativeConstraints);
    }

    return parts.join(", ");
  }

  /**
   * Call local SDXL API (Automatic1111 format)
   */
  private async callSDXLAPI(
    prompt: string,
    negativePrompt: string,
    seed: number
  ): Promise<Blob> {
    const url = `${this.apiUrl}/sdapi/v1/txt2img`;

    const payload = {
      prompt,
      negative_prompt: negativePrompt,
      seed,
      steps: 30,
      cfg_scale: 7.5,
      width: WIDTH,
      height: HEIGHT,
      sampler_name: "DPM++ 2M Karras",
      // Add LoRA if configured
      ...(this.loraPath && {
        alwayson_scripts: {
          additional_networks: {
            args: [
              {
                model: this.loraPath,
                weight: 0.8,
              },
            ],
          },
        },
      }),
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      throw new Error(`SDXL API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // Automatic1111 returns base64-encoded image
    const base64Image = data.images[0];
    const imageBytes = Buffer.from(base64Image, "base64");

    return new Blob([imageBytes], { type: "image/jpeg" });
  }

  estimateCost(): number | null {
    // Local inference has no per-generation cost
    return 0;
  }
}
```

### Step 3: Register Engine

**File:** `src/lib/image/engine/registry.ts`

```typescript
export async function createDefaultRegistry(): Promise<ImageEngineRegistry> {
  const registry = new ImageEngineRegistry();

  // Import engines dynamically
  const { PollinationsAIEngine } = await import("./providers/pollinations");
  const { PexelsStockEngine } = await import("./providers/pexels");

  registry.register(new PollinationsAIEngine());
  registry.register(new PexelsStockEngine());

  // Register SDXL Local if enabled
  if (process.env.SDXL_ENABLED === "true") {
    const { SDXLLocalEngine } = await import("./providers/sdxl-local");
    registry.register(new SDXLLocalEngine());
    registry.setDefault("stable-diffusion");
  } else {
    // Set Pollinations as default (existing behavior)
    registry.setDefault("pollinations-ai");
  }

  return registry;
}
```

### Step 4: Environment Configuration

**File:** `.env.local`

```env
# SDXL Local Configuration
SDXL_ENABLED=true
SDXL_API_URL=http://127.0.0.1:7860
SDXL_API_KEY=  # Optional, if using authentication
SDXL_LORA_PATH=  # Optional, path to fine-tuned LoRA
```

### Step 5: Testing Local Integration

**Test Script:** `scripts/test-sdxl.ts`

```typescript
import { createDefaultImageService } from "@/lib/image/service";

async function testSDXL() {
  console.log("Testing SDXL Local Integration...");

  const service = await createDefaultImageService();

  const testTopics = [
    "Benefits of morning exercise",
    "Productivity tips for remote workers",
    "Healthy meal prep ideas",
  ];

  for (const topic of testTopics) {
    console.log(`\nGenerating image for: ${topic}`);
    try {
      const result = await service.generate(topic, "ai");
      console.log(`✅ Success: ${result.url}`);
      console.log(`   Engine: ${result.source}`);
      console.log(`   Time: ${result.metadata.generationTimeMs}ms`);
    } catch (error) {
      console.error(`❌ Failed: ${error}`);
    }
  }
}

testSDXL();
```

**Run Test:**
```bash
npx tsx scripts/test-sdxl.ts
```

### Step 6: Dataset Collection (For Fine-Tuning)

**Script:** `scripts/collect-dataset.py`

```python
import os
import requests
from pathlib import Path

# Configuration
CATEGORIES = {
    "fitness": ["exercise", "workout", "gym", "fitness", "yoga"],
    "business": ["business", "office", "meeting", "corporate", "startup"],
    "lifestyle": ["lifestyle", "daily", "routine", "home", "living"],
    "travel": ["travel", "vacation", "destination", "adventure", "scenic"],
    "nutrition": ["food", "meal", "cooking", "healthy", "recipe"],
}

IMAGES_PER_CATEGORY = 1000
OUTPUT_DIR = "dataset"

# Pexels API
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

def download_image(url, path):
    response = requests.get(url)
    with open(path, "wb") as f:
        f.write(response.content)

def collect_dataset():
    for category, keywords in CATEGORIES.items():
        category_dir = Path(OUTPUT_DIR) / category
        category_dir.mkdir(parents=True, exist_ok=True)

        for keyword in keywords:
            for page in range(1, 11):  # 10 pages per keyword
                url = f"https://api.pexels.com/v1/search"
                params = {
                    "query": keyword,
                    "per_page": 20,
                    "page": page,
                    "orientation": "square",
                }
                headers = {"Authorization": PEXELS_API_KEY}

                response = requests.get(url, params=params, headers=headers)
                data = response.json()

                for photo in data.get("photos", []):
                    image_url = photo["src"]["large2x"]
                    image_id = photo["id"]
                    image_path = category_dir / f"{image_id}.jpg"

                    if not image_path.exists():
                        download_image(image_url, image_path)
                        print(f"Downloaded: {image_path}")

                if len(data.get("photos", [])) < 20:
                    break

if __name__ == "__main__":
    collect_dataset()
```

**Run Dataset Collection:**
```bash
python scripts/collect-dataset.py
```

### Step 7: Fine-Tuning with LoRA

**Using Kohya_ss (GUI):**

1. Install Kohya_ss:
```bash
git clone https://github.com/kohya-ss/sd-scripts
cd sd-scripts
pip install -r requirements.txt
```

2. Prepare dataset:
```bash
# Organize dataset in format:
dataset/
├── fitness/
│   ├── image_001.jpg
│   ├── image_001.txt
│   └── ...
└── business/
    └── ...
```

3. Create dataset config:
```toml
# dataset_config.toml
[[datasets]]
subset_name = "feedwren_social"
image_dir = "dataset"
caption_extension = ".txt"
num_repeats = 5
shuffle_caption = true
```

4. Train LoRA:
```bash
python train_network.py \
  --pretrained_model_name_or_path="stabilityai/stable-diffusion-xl-base-1.0" \
  --dataset_config="dataset_config.toml" \
  --output_dir="output" \
  --output_name="feedwren_social" \
  --save_model_as=safetensors \
  --prior_loss_weight=1.0 \
  --max_train_epochs=10 \
  --learning_rate=1e-4 \
  --lr_scheduler="cosine" \
  --network_dim=128 \
  --network_alpha=128 \
  --mixed_precision="fp16"
```

5. Update environment:
```env
SDXL_LORA_PATH=/path/to/feedwren_social.safetensors
```

### Step 8: Integration Testing

**Test Checklist:**
- [ ] Local SDXL instance running
- [ ] Provider adapter registered
- [ ] Can generate images with SDXL
- [ ] Images uploaded to Supabase correctly
- [ ] Fallback to Pollinations works if SDXL fails
- [ ] Quality compares favorably with Pollinations
- [ ] Generation time acceptable (< 15 seconds)
- [ ] LoRA loads and applies correctly (if fine-tuned)
- [ ] Memory usage stable (no leaks)
- [ ] Multiple concurrent requests handled

**Test Script:** `scripts/integration-test.ts`

```typescript
import { createDefaultImageService } from "@/lib/image/service";

async function runIntegrationTests() {
  console.log("Running Integration Tests...\n");

  const service = await createDefaultImageService();

  // Test 1: Basic generation
  console.log("Test 1: Basic generation");
  try {
    const result = await service.generate("A person exercising in a gym", "ai");
    console.log(`✅ PASS: ${result.url}`);
  } catch (error) {
    console.log(`❌ FAIL: ${error}`);
  }

  // Test 2: Intelligence layer
  console.log("\nTest 2: Intelligence layer");
  try {
    const result = await service.generate("Benefits of morning exercise", "ai");
    console.log(`✅ PASS: ${result.url}`);
  } catch (error) {
    console.log(`❌ FAIL: ${error}`);
  }

  // Test 3: Fallback
  console.log("\nTest 3: Fallback mechanism");
  try {
    const result = await service.generate("Test topic", "stock");
    console.log(`✅ PASS: ${result.url}`);
  } catch (error) {
    console.log(`❌ FAIL: ${error}`);
  }

  // Test 4: Multiple generations
  console.log("\nTest 4: Multiple generations");
  try {
    const promises = Array.from({ length: 5 }, (_, i) =>
      service.generate(`Test topic ${i}`, "ai")
    );
    const results = await Promise.all(promises);
    console.log(`✅ PASS: Generated ${results.length} images`);
  } catch (error) {
    console.log(`❌ FAIL: ${error}`);
  }

  console.log("\nIntegration tests complete.");
}

runIntegrationTests();
```

### Step 9: Production Considerations

**When Ready for Production:**

**Option A: Self-Hosted Server**
- Rent dedicated GPU server (e.g., RunPod, Lambda Labs, Vast.ai)
- Install SDXL + FeedWren provider adapter
- Configure API with authentication
- Monitor uptime and performance

**Option B: Cloud API Service**
- Use Replicate (hosted SDXL)
- Use Together AI (hosted SDXL)
- Use Hugging Face Inference API
- Integrate via HTTP API similar to local setup

**Option C: Hybrid**
- Use local SDXL for development
- Use cloud API for production
- Easy fallback between them

**Monitoring:**
- Track generation time
- Track success/failure rate
- Track GPU utilization
- Track memory usage
- Alert on failures

---

## D. Integration Points

### 1. Engine Registry

**File:** `src/lib/image/engine/registry.ts`

**Change:** Add SDXL registration

```typescript
export async function createDefaultRegistry(): Promise<ImageEngineRegistry> {
  const registry = new ImageEngineRegistry();

  // Existing engines
  const { PollinationsAIEngine } = await import("./providers/pollinations");
  const { PexelsStockEngine } = await import("./providers/pexels");
  registry.register(new PollinationsAIEngine());
  registry.register(new PexelsStockEngine());

  // New SDXL engine
  if (process.env.SDXL_ENABLED === "true") {
    const { SDXLLocalEngine } = await import("./providers/sdxl-local");
    registry.register(new SDXLLocalEngine());
    registry.setDefault("stable-diffusion");
  }

  return registry;
}
```

### 2. Environment Variables

**File:** `.env.local`

**Add:**
```env
# SDXL Configuration
SDXL_ENABLED=true
SDXL_API_URL=http://127.0.0.1:7860
SDXL_API_KEY=
SDXL_LORA_PATH=
```

### 3. Type Definitions

**File:** `src/lib/types.ts`

**Add (if needed):**
```typescript
export type ImageSourcePref = "ai" | "stock" | "mixed" | "sdxl-local";
```

### 4. Settings UI (Optional)

**File:** `src/app/dashboard/settings/page.tsx`

**Add SDXL toggle:**
```typescript
<ImageSourcePreference
  value={settings.image_source}
  onChange={(value) => updateSettings({ image_source: value })}
  options={[
    { value: "ai", label: "AI Generated" },
    { value: "stock", label: "Stock Photos" },
    { value: "mixed", label: "Mix of Both" },
    { value: "sdxl-local", label: "SDXL Local (Beta)" },
  ]}
/>
```

### 5. No Changes Required

These components work automatically with the new engine:
- ✅ Image Intelligence layer
- ✅ Diversity system
- ✅ Prompt builder
- ✅ Quality control system
- ✅ Storage layer
- ✅ Frontend UI
- ✅ Autopilot

---

## E. Local Test Checklist

### Prerequisites

- [ ] Local SDXL instance installed and running
- [ ] SDXL API accessible at configured URL
- [ ] FeedWren application running locally
- [ ] Supabase configured and accessible
- [ ] Environment variables set

### Functionality Tests

**Basic Generation:**
- [ ] Generate image with simple topic
- [ ] Image uploaded to Supabase Storage
- [ ] Image URL returned correctly
- [ ] Image displays in frontend

**Intelligence Layer:**
- [ ] Generate image with complex topic
- [ ] Topic analyzed correctly
- [ ] Visual spec created correctly
- [ ] Prompt built correctly
- [ ] Variation applied (seed generates different compositions)

**Quality:**
- [ ] Image quality acceptable (no artifacts, good resolution)
- [ ] Subject matches topic
- [ ] Composition looks professional
- [ ] Lighting looks natural
- [ ] No watermarks or text

**Performance:**
- [ ] Generation time < 15 seconds
- [ ] Memory usage stable
- [ ] No memory leaks over multiple generations
- [ ] Concurrent requests handled correctly

**Fallback:**
- [ ] Fallback to Pollinations if SDXL fails
- [ ] Fallback to Stock if AI fails
- [ ] User informed of fallback (if applicable)

**LoRA (if fine-tuned):**
- [ ] LoRA loads correctly
- [ ] LoRA affects output style
- [ ] LoRA weight works correctly
- [ ] Multiple LoRAs can be switched

### Regression Tests

- [ ] Existing manual generation still works
- [ ] Autopilot generation still works
- [ ] Facebook publishing still works
- [ ] Settings page still works
- [ ] No breaking changes to other features

### Stress Tests

- [ ] Generate 10 images sequentially
- [ ] Generate 5 images concurrently
- [ ] Generate 50 images in batch
- [ ] Monitor GPU memory during stress test
- [ ] Monitor API response times

---

## F. Report Section

### Root Cause

**Current State:**
FeedWren uses external image generation providers (Pollinations AI and Pexels Stock) which have limitations:
- No control over model quality or updates
- Dependence on third-party uptime
- Potential privacy concerns (topics sent externally)
- Rate limits and potential future costs
- No customization for FeedWren's specific use cases

**Problem:**
No internal AI image model pipeline exists for FeedWren, limiting control, customization, and long-term sustainability.

### Changes Made

**No Code Changes Yet**
This document is a design and implementation plan. No code has been modified yet.

**Proposed Changes:**
1. Create `src/lib/image/engine/providers/sdxl-local.ts` - SDXL provider adapter
2. Modify `src/lib/image/engine/registry.ts` - Register SDXL engine
3. Add environment variables for SDXL configuration
4. Create test scripts for validation
5. Create dataset collection script for fine-tuning
6. Document fine-tuning process with LoRA

### Open Questions

**Technical:**
1. Which SDXL backend to use? (Automatic1111, ComfyUI, or direct PyTorch)
2. Should we use SDXL 1.0 or wait for SDXL 2.0?
3. What image resolution to target? (1024x1024, 1200x1200, or 1080x1080)
4. How to handle model updates? (Automatic or manual)
5. Should we cache generated images locally?

**Dataset:**
1. How many images per category for fine-tuning? (1K, 5K, 10K?)
2. Which sources to use for dataset? (Pexels, Unsplash, Pixabay, custom?)
3. How to handle copyright/licensing for dataset images?
4. Should we include user-generated content in dataset?
5. How to label and caption dataset images?

**Infrastructure:**
1. Should we self-host or use cloud API for production?
2. Which cloud provider if using cloud? (RunPod, Lambda, Replicate, Together AI)
3. How to handle authentication for local SDXL API?
4. Should we use GPU autoscaling?
5. How to monitor and alert on failures?

**Cost:**
1. What is the acceptable cost per generation?
2. Should we charge users for image generation?
3. How to optimize for cost vs. quality?
4. Should we use cheaper models for previews?
5. How to track and report costs?

**Quality:**
1. How to measure image quality objectively?
2. Should we use quality control system?
3. How to handle low-quality generations?
4. Should we implement user feedback loop?
5. How to compare with external providers?

**Timeline:**
1. When to start Phase 1 (local SDXL)?
2. When to start Phase 2 (fine-tuning)?
3. When to consider Phase 4 (full training)?
4. What is the minimum viable product?
5. What are the success criteria for each phase?

### Recommendations

**Immediate (Next 1-2 Weeks):**
1. Install local SDXL (Automatic1111) for development
2. Create SDXL provider adapter
3. Test integration with FeedWren
4. Compare quality with Pollinations
5. Decide on production deployment strategy

**Short-term (Next 1-2 Months):**
1. Collect dataset for fine-tuning
2. Train initial LoRA on small subset
3. Validate fine-tuning improves results
4. Full LoRA training on complete dataset
5. Deploy to production (local or cloud)

**Medium-term (Next 3-6 Months):**
1. Train specialized LoRAs per category
2. Implement LoRA selection logic
3. Optimize generation performance
4. Implement quality control system
5. Add monitoring and alerting

**Long-term (6+ Months):**
1. Evaluate if LoRA is sufficient
2. Consider full model training if needed
3. Explore custom model architectures
4. Build ML pipeline for continuous improvement
5. Consider user feedback integration

---

## G. Cost Analysis

### Phase 1: Local SDXL Integration

**If Using Existing GPU:**
- Software: $0 (open-source)
- Per generation: $0 (electricity only)
- Monthly: ~$10-20 (electricity for moderate use)

**If Renting Cloud GPU:**
- GPU rental: $0.40-$1.00/hour (RunPod/Lambda)
- Per generation: $0.01-$0.03 (assuming 8-12 seconds)
- Monthly (1000 generations): $10-30
- Monthly (10,000 generations): $100-300

### Phase 2: Fine-Tuning with LoRA

**Dataset Collection:**
- API calls: $0 (Pexels API is free)
- Storage: $5-10/month (for dataset)
- Total: $5-10 (one-time)

**Training (Local GPU):**
- GPU time: 1-3 hours
- Electricity: $5-10
- Total: $5-10

**Training (Cloud GPU):**
- GPU rental: $50-200 (RTX 3090/A100 for 1-3 hours)
- Total: $50-200

**Per Generation After Fine-Tuning:**
- Same as Phase 1 (LoRA adds minimal overhead)

### Phase 3: Multiple LoRAs

**Training:**
- 5 specialized LoRAs: $50-250 (cloud) or $25-50 (local)
- Storage: $10-20/month

**Per Generation:**
- Same as Phase 1 (LoRA selection is cheap)

### Phase 4: Full Model Training

**Training:**
- Multiple A100s: $10,000-100,000
- Time: Days to weeks
- Not recommended unless absolutely necessary

### Cost Comparison

| Phase | One-time Cost | Monthly Cost | Per Generation |
|-------|--------------|--------------|----------------|
| Current (Pollinations) | $0 | $0 | $0 (but limited) |
| Phase 1 (Local GPU) | $0 | $10-20 | $0 |
| Phase 1 (Cloud GPU) | $0 | $10-300 | $0.01-0.03 |
| Phase 2 (Local Fine-tune) | $15-20 | $10-20 | $0 |
| Phase 2 (Cloud Fine-tune) | $55-210 | $10-300 | $0.01-0.03 |
| Phase 3 (Multi-LoRA) | $35-270 | $20-320 | $0.01-0.03 |
| Phase 4 (Full Training) | $10,000-100,000 | $100-500 | $0.01-0.05 |

---

## H. Risk Assessment

### Technical Risks

**Risk:** Local SDXL integration is complex
**Mitigation:** Start with Automatic1111 (easiest), test thoroughly

**Risk:** GPU compatibility issues
**Mitigation:** Use cloud GPU if local GPU insufficient

**Risk:** Model quality worse than Pollinations
**Mitigation:** A/B test, keep Pollinations as fallback

**Risk:** Fine-tuning doesn't improve results
**Mitigation:** Start with small dataset, validate before full training

### Infrastructure Risks

**Risk:** Local GPU downtime
**Mitigation:** Cloud backup, fallback to Pollinations

**Risk:** Cloud GPU costs higher than expected
**Mitigation:** Monitor usage, set budgets, optimize prompts

**Risk:** API authentication/security issues
**Mitigation:** Use API keys, rate limiting, monitoring

### Data Risks

**Risk:** Dataset copyright issues
**Mitigation:** Use permissive sources (Pexels, Unsplash), document licenses

**Risk:** Dataset quality poor
**Mitigation:** Manual review, automated filtering, iterative improvement

**Risk:** Data breach (user topics)
**Mitigation:** Local inference, no external API calls, encryption

### Business Risks

**Risk:** Higher costs than expected
**Mitigation:** Start with local GPU, monitor costs, optimize

**Risk:** User experience degraded
**Mitigation:** A/B testing, fallback mechanisms, user feedback

**Risk:** Maintenance burden
**Mitigation:** Automation, monitoring, documentation

---

## I. Success Criteria

### Phase 1 Success Criteria

- [ ] Local SDXL generates images successfully
- [ ] Image quality comparable to Pollinations
- [ ] Generation time < 15 seconds
- [ ] Integration with FeedWren complete
- [ ] Fallback to Pollinations works
- [ ] No breaking changes to existing features

### Phase 2 Success Criteria

- [ ] Dataset collected (5,000+ images)
- [ ] LoRA trained successfully
- [ ] Fine-tuned images better than base SDXL
- [ ] Fine-tuned images better than Pollinations
- [ ] LoRA loads and applies correctly
- [ ] Performance acceptable (< 15 seconds)

### Phase 3 Success Criteria

- [ ] Multiple LoRAs trained (5+ categories)
- [ ] LoRA selection works correctly
- [ ] Category-specific results improved
- [ ] Performance acceptable (< 15 seconds)
- [ ] Storage and management system in place

### Overall Success Criteria

- [ ] Reduced dependence on external providers
- [ ] Better control over image quality
- [ ] Cost-effective at scale
- [ ] Maintainable and extensible
- [ ] User experience improved or maintained

---

## J. Next Steps

### Immediate Actions

1. **Review this document** with team/stakeholders
2. **Decide on SDXL backend** (Automatic1111, ComfyUI, or PyTorch)
3. **Check GPU availability** (local or cloud)
4. **Set budget** for cloud GPU if needed
5. **Install local SDXL** for development/testing

### Short-term Actions

1. **Create SDXL provider adapter** (Step 2 in implementation plan)
2. **Register engine in registry** (Step 3)
3. **Configure environment variables** (Step 4)
4. **Test integration** (Step 5)
5. **Compare quality with Pollinations**

### Medium-term Actions

1. **Collect dataset** for fine-tuning (Step 6)
2. **Train initial LoRA** (Step 7)
3. **Integration testing** (Step 8)
4. **Decide on production deployment**
5. **Deploy to production**

### Long-term Actions

1. **Monitor performance** in production
2. **Collect user feedback**
3. **Iterate on fine-tuning**
4. **Consider specialized LoRAs** (Phase 3)
5. **Evaluate full training** (Phase 4, if needed)

---

## K. Appendix

### A. Resources

**Stable Diffusion Resources:**
- Official repo: https://github.com/Stability-AI/stablediffusion
- Automatic1111: https://github.com/AUTOMATIC1111/stable-diffusion-webui
- ComfyUI: https://github.com/comfyanonymous/ComfyUI
- Hugging Face: https://huggingface.co/models?pipeline_tag=text-to-image

**Fine-Tuning Resources:**
- Kohya_ss: https://github.com/kohya-ss/sd-scripts
- DreamBooth: https://dreambooth.github.io/
- Hugging Face diffusers: https://huggingface.co/docs/diffusers/training

**Cloud GPU Providers:**
- RunPod: https://www.runpod.io/
- Lambda Labs: https://lambdalabs.com/
- Vast.ai: https://vast.ai/
- Replicate: https://replicate.com/

**API Services:**
- Together AI: https://www.together.ai/
- Hugging Face Inference: https://huggingface.co/inference-api

### B. Commands Reference

**Start Automatic1111:**
```bash
# Windows
webui-user.bat --api --listen 127.0.0.1:7860

# Linux/Mac
./webui.sh --api --listen 127.0.0.1:7860
```

**Start ComfyUI:**
```bash
python main.py --listen 127.0.0.1:8188
```

**Test SDXL API:**
```bash
curl -X POST http://127.0.0.1:7860/sdapi/v1/txt2img \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset",
    "steps": 20,
    "width": 1024,
    "height": 1024
  }'
```

**Train LoRA (Kohya_ss):**
```bash
python train_network.py \
  --pretrained_model_name_or_path="stabilityai/stable-diffusion-xl-base-1.0" \
  --dataset_config="dataset_config.toml" \
  --output_dir="output" \
  --output_name="feedwren_social" \
  --network_dim=128 \
  --network_alpha=128
```

### C. Troubleshooting

**SDXL API not responding:**
- Check if SDXL instance is running
- Check API URL configuration
- Check firewall settings
- Check logs for errors

**Out of memory errors:**
- Reduce batch size
- Use smaller model (SD 1.5 instead of SDXL)
- Increase GPU memory or use cloud GPU
- Use gradient checkpointing

**Poor image quality:**
- Increase steps (20 → 30-50)
- Adjust CFG scale (7.5 → 8-12)
- Try different sampler (DPM++ 2M Karras, Euler a)
- Fine-tune on better dataset

**Slow generation:**
- Use GPU instead of CPU
- Reduce image resolution
- Use xformers for optimization
- Use smaller model (SD 1.5 instead of SDXL)

**LoRA not working:**
- Check LoRA file path
- Check LoRA weight (0.5-1.0 typical)
- Check LoRA compatibility with SDXL
- Check if LoRA was trained correctly

---

**End of Document**
