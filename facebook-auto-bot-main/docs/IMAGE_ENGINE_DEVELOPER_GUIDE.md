# FeedWren Image Engine - Developer Guide

**Status:** Phase 1 Complete  
**Last Updated:** 2026-10-05  
**Version:** 1.1

---

## Quick Start

### Adding a New Image Engine

If you want to add a new image engine (e.g., Stable Diffusion, FLUX, or a custom FeedWren model), follow these steps:

### Step 1: Create the Engine Implementation

Create a new file in `src/lib/image/engine/providers/`:

```typescript
// src/lib/image/engine/providers/my-engine.ts
import type {
  ImageEngine,
  ImageGenerationRequest,
  ImageGenerationResult,
  ImageEngineType,
} from "../interface";

export class MyEngine implements ImageEngine {
  readonly type: ImageEngineType = "my-engine";
  readonly name = "My Custom Engine";
  readonly available = true; // or check availability dynamically
  readonly estimatedTimeMs = 5000;

  canHandle(request: ImageGenerationRequest): boolean {
    // Return true if this engine can handle the request
    return true;
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    // Generate the image
    // Return result with metadata
    return {
      url: "https://...",
      engine: this.type,
      metadata: {
        generationId: "...",
        engine: this.type,
        generationTimeMs: 5000,
        timestamp: new Date().toISOString(),
      },
    };
  }

  estimateCost(): number | null {
    // Return cost in USD, or null if not applicable
    return 0;
  }
}
```

### Step 2: Register the Engine

Update `src/lib/image/engine/registry.ts`:

```typescript
import { MyEngine } from "./providers/my-engine";

export async function createDefaultRegistry(): Promise<ImageEngineRegistry> {
  const registry = new ImageEngineRegistry();

  // Existing engines
  registry.register(new PollinationsAIEngine());
  registry.register(new PexelsStockEngine());

  // Add your new engine
  registry.register(new MyEngine());

  // Set default if needed
  registry.setDefault("pollinations-ai");

  return registry;
}
```

### Step 3: Update Source Mapping (if needed)

If your engine should be selectable by source preference, update `src/lib/image/service.ts`:

```typescript
private sourceToEngineType(source: ImageSource): ImageEngineType {
  switch (source) {
    case "ai":
      return "pollinations-ai";
    case "stock":
      return "pexels-stock";
    case "my-engine":
      return "my-engine"; // Add this
    default:
      return "pollinations-ai";
  }
}

private engineTypeToSource(engineType: ImageEngineType): ImageSource {
  switch (engineType) {
    case "pollinations-ai":
      return "ai";
    case "pexels-stock":
      return "stock";
    case "my-engine":
      return "ai"; // Add this
    default:
      return "ai";
  }
}
```

### Step 4: Update Types (if new source type)

If you need a new source type, update `src/lib/types.ts`:

```typescript
export type ImageSource = "ai" | "stock" | "my-engine";
export type ImageSourcePref = "ai" | "stock" | "mixed" | "my-engine";
```

### Step 5: Test

Run the application and test:
```bash
npm run dev
```

Test image generation in the dashboard or via the API.

---

## Architecture Overview

### Component Hierarchy

```
Application (Dashboard, Autopilot, API)
    ↓
generateImage() in src/lib/ai/image.ts
    ↓
ImageGenerationService in src/lib/image/service.ts
    ↓
ImageEngineRegistry in src/lib/image/engine/registry.ts
    ↓
ImageEngine Interface
    ↓
┌──────────────┬──────────────┬──────────────┐
│ Pollinations  │   Pexels     │  Future      │
│  Adapter     │   Adapter    │  Engines     │
└──────────────┴──────────────┴──────────────┘
```

### Key Components

#### 1. Image Engine Interface

**File:** `src/lib/image/engine/interface.ts`

Defines the contract that all image engines must implement:
- `ImageEngine` - Main engine interface
- `ImageGenerationRequest` - Structured request type
- `ImageGenerationResult` - Result with metadata
- `ImageEngineType` - Engine identifiers

#### 2. Engine Registry

**File:** `src/lib/image/engine/registry.ts`

Manages available engines:
- Register/unregister engines
- Select engine for request
- Manage default engine
- List available engines

#### 3. Image Generation Service

**File:** `src/lib/image/service.ts`

Main service layer:
- Validates requests
- Selects appropriate engine
- Handles fallback logic
- Normalizes results
- Maps between source types and engine types

#### 4. Provider Adapters

**Files:**
- `src/lib/image/engine/providers/pollinations.ts` - Pollinations AI adapter
- `src/lib/image/engine/providers/pexels.ts` - Pexels stock adapter

Implement the `ImageEngine` interface for specific providers.

#### 5. Existing Integration

**File:** `src/lib/ai/image.ts`

Maintains backward compatibility:
- Public API unchanged
- Uses new service when enabled
- Falls back to old implementation if needed

---

## Configuration

### Environment Variables

**Pexels API Key:**
```env
PEXELS_API_KEY=your_pexels_api_key_here
```

### Service Configuration

**File:** `src/lib/image/service.ts`

The service can be configured with:

```typescript
const config: ImageServiceConfig = {
  enableFallback: true,      // Enable fallback on failure
  defaultSource: "ai",     // Default source preference
};
```

### Toggle New Engine Service

**File:** `src/lib/ai/image.ts`

Set the flag to enable/disable the new engine service:

```typescript
const USE_NEW_ENGINE_SERVICE = true;  // Set to false to use old implementation
```

---

## Fallback Behavior

The service implements the same fallback logic as the original system:

1. **Primary Engine Failure:**
   - If AI generation fails → try Stock
   - If Stock generation fails → try AI

2. **Fallback Enabled:**
   - Controlled by `enableFallback` config
   - Default: `true`

3. **Fallback Disabled:**
   - Primary engine failure throws error immediately

---

## Error Handling

### Provider Errors

All provider errors are normalized through the engine interface:
- Missing API keys
- Invalid API keys
- Rate limiting
- Network failures
- Timeouts
- Empty results
- Malformed responses

### Service Errors

The service normalizes errors and provides:
- Clear error messages
- Stack traces for debugging
- Metadata about what failed

---

## Testing

### Manual Testing

**Test AI Generation:**
```bash
# In dashboard
1. Go to Generate page
2. Set source to "AI"
3. Enter topic
4. Generate
```

**Test Stock Generation:**
```bash
# In dashboard
1. Go to Generate page
2. Set source to "Stock"
3. Enter topic
4. Generate
```

**Test Fallback:**
```bash
# Temporarily disable API key
# Test that fallback works
```

### API Testing

```bash
curl -X POST http://localhost:3000/api/generate/image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test topic", "source": "ai"}'
```

---

## Future Work

### Phase 2: Self-Hosted Model

Add a self-hosted model engine (e.g., Stable Diffusion):
- Deploy inference server
- Create adapter for inference API
- Register in registry
- Test and validate

### Phase 3: Quality Control

Add quality control layer:
- Resolution validation
- Corruption detection
- Duplicate detection
- Topic relevance scoring

### Phase 4: Dataset Pipeline

Build dataset pipeline for fine-tuning:
- Data ingestion
- Validation
- Filtering
- Labeling

---

## Troubleshooting

### Engine Not Available

If an engine shows as unavailable:
- Check environment variables
- Check API key configuration
- Check provider status

### Generation Fails

If generation fails:
- Check server logs
- Check provider status
- Verify API key
- Check network connectivity

### Fallback Not Working

If fallback doesn't work:
- Check `enableFallback` config
- Check if fallback engine is registered
- Check if fallback engine is available

---

## Support

For issues or questions:
1. Check the main architecture document: `docs/IMAGE_ENGINE_ARCHITECTURE.md`
2. Check the engine interface: `src/lib/image/engine/interface.ts`
3. Check existing adapters for reference
