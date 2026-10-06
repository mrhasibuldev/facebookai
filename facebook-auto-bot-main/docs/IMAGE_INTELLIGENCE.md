# FeedWren Image Intelligence - Phase 2

**Status:** Complete ✅
**Last Updated:** 2026-10-05
**Version:** 2.0

---

## Table of Contents

1. [Overview](#overview)
2. [Why Topic Understanding Exists](#why-topic-understanding-exists)
3. [Architecture](#architecture)
4. [TopicUnderstanding](#topicunderstanding)
5. [VisualGenerationSpec](#visualgenerationspec)
6. [PromptBuilder](#promptbuilder)
7. [Diversity System](#diversity-system)
8. [StockSearchSpec](#stocksearchspec)
9. [AI Image Flow](#ai-image-flow)
10. [Stock Search Flow](#stock-search-flow)
11. [Autopilot Integration](#autopilot-integration)
12. [Error Fallback](#error-fallback)
13. [How to Extend](#how-to-extend)
14. [Known Limitations](#known-limitations)

---

## Overview

Phase 2 introduces an intermediate "Image Intelligence" layer between user topics and image providers. This layer:

- Understands topics beyond raw text
- Creates structured visual specifications
- Generates diverse, topic-relevant prompts
- Adapts to different provider types (AI vs stock)
- Maintains provider independence

**Key Principle:** DO NOT send the raw user topic directly to the image provider when the intelligence layer can create a better structured visual request.

---

## Why Topic Understanding Exists

### Problem: Raw Topic → Image Provider

Previously, FeedWren passed user topics directly to image providers:

```
User: "Benefits of morning exercise"
         ↓
Provider: Generate image from "Benefits of morning exercise"
         ↓
Result: Generic, repetitive images
```

This produced:
- Repetitive visual compositions
- Generic images
- Weak topic understanding
- Similar-looking images
- Poor subject selection

### Solution: Intelligence Layer

Now, FeedWren analyzes the topic first:

```
User: "Benefits of morning exercise"
         ↓
Topic Understanding
→ Category: fitness
→ Subject: morning exercise
→ Action: physical activity
→ Environment: outdoor/park
→ Mood: positive, energetic
         ↓
Visual Specification
→ Subject: person exercising
→ Environment: park/gym
→ Lighting: natural morning light
→ Composition: dynamic action shot
         ↓
Provider: Generate from structured visual spec
         ↓
Result: Topic-specific, diverse, relevant images
```

---

## Architecture

### Before Phase 2

```
USER TOPIC
    ↓
Image Service
    ↓
Engine Registry
    ↓
Provider (Pollinations/Pexels)
    ↓
Image
```

### After Phase 2

```
USER TOPIC
    ↓
TOPIC UNDERSTANDING (NEW)
    ↓
VISUAL GENERATION SPEC (NEW)
    ↓
DIVERSITY SYSTEM (NEW)
    ↓
PROMPT BUILDER (NEW)
    ↓
Image Service
    ↓
Engine Registry
    ↓
Provider (Pollinations/Pexels)
    ↓
Image
```

### File Structure

```
src/lib/image/
├── intelligence/
│   ├── topic-analyzer.ts      # Topic analysis and categorization
│   ├── visual-spec.ts         # Visual specification creation
│   ├── diversity.ts           # Controlled variation system
│   ├── prompt-builder.ts      # AI prompt construction
│   ├── stock-search.ts        # Stock search query building
│   └── index.ts               # Public exports
├── engine/
│   ├── interface.ts           # Engine interface (Phase 1)
│   ├── registry.ts            # Engine registry (Phase 1)
│   └── providers/
│       ├── pollinations.ts    # AI provider (enhanced)
│       └── pexels.ts          # Stock provider (enhanced)
└── service.ts                 # Image service (enhanced)
```

---

## TopicUnderstanding

### Purpose

Transform raw topic strings into structured visual understanding without requiring external AI calls.

### Structure

```typescript
interface TopicUnderstanding {
  originalTopic: string;
  category: TopicCategory;
  primarySubject: string;
  subjectType: "person" | "object" | "concept" | "action" | "scene";
  action?: string;
  context?: string;
  audience?: string;
  emotionalTone: "positive" | "neutral" | "negative" | "mixed";
  intent: "educational" | "promotional" | "informational" | "inspirational" | "general";
  visualKeywords: string[];
  forbiddenOrAvoidedElements: string[];
  suggestedComposition: "close-up" | "medium-shot" | "wide-scene" | "environmental" | "action";
  suggestedStyle: "photorealistic" | "lifestyle" | "editorial" | "minimal" | "cinematic";
  suggestedColorMood: "warm" | "cool" | "neutral" | "vibrant" | "muted";
}
```

### Categories

The system recognizes 17 topic categories:

- health, fitness, nutrition
- education, technology, business, finance, productivity
- lifestyle, travel, motivation, science, environment
- news, tutorial, product, social, general

### Example

**Input:** "Benefits of drinking enough water"

**Output:**
```typescript
{
  originalTopic: "Benefits of drinking enough water",
  category: "health",
  primarySubject: "drinking water",
  subjectType: "action",
  emotionalTone: "positive",
  intent: "educational",
  visualKeywords: ["wellness", "healthy", "care", "drinking water"],
  forbiddenOrAvoidedElements: ["text", "watermark", "graphic medical imagery"],
  suggestedComposition: "environmental",
  suggestedStyle: "lifestyle",
  suggestedColorMood: "warm"
}
```

---

## VisualGenerationSpec

### Purpose

Provider-independent description of what visual content should be generated.

### Structure

```typescript
interface VisualGenerationSpec {
  topic: string;
  category: string;
  subject: string;
  secondarySubjects?: string[];
  subjectType: string;
  environment?: string;
  background?: string;
  action?: string;
  cameraPerspective?: CameraPerspective;
  framing?: Framing;
  composition?: string;
  lighting?: Lighting;
  timeOfDay?: TimeOfDay;
  atmosphere?: Atmosphere;
  emotionalTone?: string;
  visualStyle?: VisualStyle;
  realismLevel?: RealismLevel;
  colorMood?: ColorMood;
  importantDetails?: string[];
  negativeElements?: string[];
  aspectRatio?: AspectRatio;
  outputIntent?: OutputIntent;
  includeText?: boolean;
  audience?: string;
}
```

### Key Characteristics

- **Provider-agnostic:** Describes WHAT, not HOW
- **Structured:** Clear separation of concerns
- **Extensible:** Easy to add new fields
- **Validated:** Type-safe throughout

---

## PromptBuilder

### Purpose

Convert VisualGenerationSpec into provider-neutral visual prompts for AI image generation.

### Approach

The prompt builder constructs natural language prompts in logical order:

1. Subject (most important)
2. Environment
3. Composition
4. Lighting
5. Style
6. Important details

### Example

**Input Spec:**
```typescript
{
  subject: "person drinking water",
  environment: "outdoor park",
  lighting: "natural",
  visualStyle: "lifestyle",
  emotionalTone: "positive"
}
```

**Output Prompt:**
```
person drinking water, outdoor park, clean, motivational fitness environment, medium-shot, eye-level, natural lighting, morning, lifestyle style, photorealistic, warm colors, wellness, healthy
```

**Negative Prompt:**
```
text, watermark, logo, signature, collage, grid, border, frame, blurry, low quality, distorted, unnatural, unrealistic, bad anatomy, excessive glow, neon, oversaturated, cartoonish
```

### Features

- **Topic accuracy:** Prioritizes subject relevance
- **Natural composition:** Avoids prompt stuffing
- **Negative constraints:** Explicitly avoids unwanted elements
- **Metadata:** Tracks what was built for debugging

---

## Diversity System

### Purpose

Ensure multiple generations of the same topic produce visually diverse images while maintaining topic relevance.

### Approach

Uses **controlled, deterministic variation** based on a seed rather than random choices.

### Variation Profile

```typescript
interface VariationProfile {
  compositionVariant: string;
  cameraVariant: CameraPerspective;
  environmentVariant: string;
  lightingVariant: Lighting;
  timeOfDayVariant: TimeOfDay;
  moodVariant: string;
  perspectiveVariant: string;
}
```

### Topic-Aware Variation

Variation is topic-aware - it doesn't randomly combine incompatible elements:

**Good:**
- Fitness topic + gym environment + action composition
- Travel topic + scenic environment + wide composition

**Bad:**
- Fitness topic + office environment
- Travel topic + studio lighting

### Deterministic Seeds

Same seed = same variation
Different seed = different variation

This enables:
- Reproducible debugging
- Controlled testing
- Predictable variation

### Example

```typescript
const baseSpec = createVisualSpec(analyzeTopic("Morning exercise"));

// Variation 1
const spec1 = generateVariedSpec(baseSpec, 123);
// → medium-shot, eye-level, gym, natural lighting

// Variation 2
const spec2 = generateVariedSpec(baseSpec, 456);
// → medium-long-shot, high-angle, outdoor park, golden-hour lighting
```

---

## StockSearchSpec

### Purpose

Convert VisualGenerationSpec into appropriate search queries for stock photo providers.

### Difference from AI Prompts

Stock search doesn't accept complex visual prompts. It needs concise, relevant search terms.

**AI Prompt:** "person drinking water, outdoor park, clean, motivational fitness environment, medium-shot, eye-level, natural lighting, morning, lifestyle style, photorealistic, warm colors"

**Stock Query:** "hydration wellness fitness person"

### Structure

```typescript
interface StockSearchSpec {
  query: string;              // Primary search query (2-4 terms)
  alternativeQueries: string[];  // Fallback queries
  orientation: "square" | "landscape" | "portrait";
  size: "large" | "medium" | "small";
  color?: string;
}
```

### Alternative Queries

If the primary query returns no results, the system tries alternative queries in order:

1. Subject + category term
2. Subject alone
3. Subject + environment word
4. Category term

---

## AI Image Flow

```
USER TOPIC
    ↓
analyzeTopic()
    ↓
TopicUnderstanding
    ↓
createVisualSpec()
    ↓
VisualGenerationSpec
    ↓
generateVariedSpec() [if seed provided]
    ↓
Varied VisualGenerationSpec
    ↓
buildVisualPrompt()
    ↓
BuiltPrompt { prompt, negativePrompt }
    ↓
Pollinations Adapter
    ↓
Pollinations API
    ↓
Image
```

### Enhancement in Pollinations Adapter

The Pollinations adapter now:
1. Checks if intelligence data is available (style/composition fields)
2. If available, builds a visual spec and uses the prompt builder
3. If not available, falls back to simple prompt construction
4. This maintains backward compatibility

---

## Stock Search Flow

```
USER TOPIC
    ↓
analyzeTopic()
    ↓
TopicUnderstanding
    ↓
createVisualSpec()
    ↓
VisualGenerationSpec
    ↓
createStockSearchSpec()
    ↓
StockSearchSpec { query, alternativeQueries, orientation }
    ↓
Pexels Adapter
    ↓
Pexels API Search
    ↓
If no results:
    Try alternativeQueries in order
    ↓
Image
```

### Enhancement in Pexels Adapter

The Pexels adapter now:
1. Extracts stock search spec from engine-specific metadata
2. Uses the intelligent query if available
3. Tries alternative queries if primary returns no results
4. Falls back to simple query construction if no intelligence data

---

## Autopilot Integration

Autopilot already calls `generateImage()` from `src/lib/ai/image.ts`.

Since the image service now uses the intelligence layer by default, autopilot automatically benefits from:

- Better topic understanding
- Structured visual specifications
- Diverse prompts
- Improved stock search queries

**No changes required to autopilot code.**

---

## Error Fallback

### Intelligence Layer Failure

If topic understanding fails:
- Falls back to basic ImageGenerationRequest with just the topic
- Provider uses its default prompt construction
- Image generation continues

### Prompt Builder Failure

If prompt construction fails:
- Falls back to simple topic-based prompt
- Image generation continues

### Provider Failure

If the selected provider fails:
- Existing fallback behavior (ai ↔ stock) still works
- No changes to fallback logic

### Graceful Degradation

The system is designed to fail gracefully:
- Intelligence layer failure → basic request
- Prompt builder failure → simple prompt
- Provider failure → fallback provider
- All failures → error to user

**The intelligence layer never makes the existing system fragile.**

---

## How to Extend

### Add a New Topic Category

Edit `src/lib/image/intelligence/topic-analyzer.ts`:

```typescript
const CATEGORY_PATTERNS: Record<TopicCategory, RegExp[]> = {
  // ... existing categories
  "new-category": [
    /\b(keyword1|keyword2|keyword3)\b/i,
  ],
};
```

Add category-specific mappings in the same file.

### Change How Topics Become Visual Prompts

Edit `src/lib/image/intelligence/prompt-builder.ts`:

- Modify `buildSubjectDescription()` for subject handling
- Modify `buildEnvironmentDescription()` for environment
- Modify `buildStyleDescription()` for style
- Or modify the overall order in `buildVisualPrompt()`

### Add a New Image Provider

Edit `src/lib/image/engine/providers/`:

1. Create new provider file (e.g., `new-provider.ts`)
2. Implement `ImageEngine` interface
3. Register in `src/lib/image/engine/registry.ts`
4. Add mapping in `src/lib/image/service.ts`

### Change Provider Selection

Edit `src/lib/image/service.ts`:

- Modify `sourceToEngineType()` for new mappings
- Modify `select()` in registry for selection logic

### Change Facebook Publishing

Edit `src/lib/facebook/` - not part of image intelligence.

---

## Known Limitations

### Current Limitations

1. **Rule-Based Analysis:** Topic analysis uses pattern matching, not NLP/AI. It may miss subtle topic nuances.

2. **Limited Categories:** 17 categories cover many cases but not all edge cases. Unknown topics default to "general".

3. **No External AI:** The intelligence layer doesn't call external AI APIs (by design for performance and cost).

4. **Fixed Variation Families:** Composition and lighting families are predefined. Could be expanded.

5. **No Quality Evaluation:** Phase 2 doesn't include image quality evaluation (planned for future).

6. **No Repetition Detection:** Phase 2 doesn't detect duplicate images (planned for future).

7. **Test Framework:** Jest tests were written but project doesn't have Jest configured. Tests are for reference/future integration.

### Future Enhancements

1. **NLP/AI Analysis:** Use AI for deeper topic understanding when cost/performance allows.

2. **More Categories:** Expand topic categories based on real usage data.

3. **Quality Evaluation:** Add image quality scoring and retry logic.

4. **Repetition Detection:** Add hash-based duplicate detection.

5. **User Feedback:** Learn from user which images work best.

6. **Custom Variation:** Allow users to specify variation preferences.

---

## Future Model Readiness

This architecture prepares FeedWren for a future internal image model by:

1. **Provider Independence:** The intelligence layer doesn't know which provider is being used.

2. **Structured Requests:** Future models can accept VisualGenerationSpec directly.

3. **Clean Separation:**
   - Intelligence = what to generate
   - Service = orchestration
   - Engine = how to generate
   - Storage = where to store
   - Facebook = where to publish

4. **Extensible Interface:** Easy to add FeedWren Internal Engine to the registry.

5. **Standardized Metadata:** All engines return consistent metadata for tracking.

### Future Integration Path

When FeedWren has an internal model:

```
USER TOPIC
    ↓
Topic Understanding (unchanged)
    ↓
Visual Spec (unchanged)
    ↓
FeedWren Internal Adapter (NEW)
    ↓
FeedWren Internal Model (NEW)
    ↓
Quality Control (NEW)
    ↓
Storage (unchanged)
```

The intelligence layer remains the same. Only the provider adapter changes.

---

## Summary

Phase 2 successfully introduces an intelligent image generation layer that:

✅ Understands topics beyond raw text
✅ Creates structured visual specifications
✅ Generates diverse, topic-relevant prompts
✅ Adapts to AI and stock providers
✅ Maintains provider independence
✅ Provides graceful fallback
✅ Prepares for future internal models
✅ Preserves backward compatibility

The FeedWren application is now more intelligent, more diverse, and ready for future expansion.
