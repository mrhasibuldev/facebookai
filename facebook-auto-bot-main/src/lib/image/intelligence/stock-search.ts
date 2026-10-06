/**
 * Stock Search Specification
 *
 * Converts VisualGenerationSpec into appropriate search queries for stock photo
 * providers like Pexels.
 *
 * Unlike AI generation, stock search doesn't accept complex visual prompts.
 * Instead, it needs concise, relevant search terms that will return appropriate
 * existing photos.
 */

import type { VisualGenerationSpec } from "./visual-spec";

/**
 * Stock search specification
 */
export interface StockSearchSpec {
  /** Primary search query (concise) */
  query: string;
  /** Alternative search queries for fallback */
  alternativeQueries: string[];
  /** Preferred orientation */
  orientation: "square" | "landscape" | "portrait";
  /** Minimum size preference */
  size: "large" | "medium" | "small";
  /** Color preference (optional) */
  color?: string;
}

/**
 * Extract key search terms from visual spec
 */
function extractSearchTerms(spec: VisualGenerationSpec): string[] {
  const terms: string[] = [];

  // Subject is most important
  terms.push(spec.subject);

  // Add category-specific terms
  const categoryTerms: Record<string, string[]> = {
    fitness: ["exercise", "workout", "training", "gym", "fitness"],
    nutrition: ["food", "healthy eating", "meal", "nutrition", "cooking"],
    education: ["learning", "study", "school", "education", "classroom"],
    technology: ["technology", "digital", "tech", "innovation", "software"],
    business: ["business", "office", "professional", "corporate", "startup"],
    finance: ["finance", "money", "investment", "financial", "savings"],
    productivity: ["productivity", "work", "office", "focus", "organized"],
    lifestyle: ["lifestyle", "daily life", "home", "wellness", "balance"],
    travel: ["travel", "vacation", "destination", "journey", "adventure"],
    motivation: ["motivation", "success", "achievement", "goal", "inspiration"],
    health: ["health", "wellness", "medical", "care", "healthy"],
    general: ["professional", "quality", "modern", "clean"],
  };

  if (spec.category in categoryTerms) {
    terms.push(...categoryTerms[spec.category].slice(0, 2));
  }

  // Add important details as search terms
  if (spec.importantDetails && spec.importantDetails.length > 0) {
    terms.push(...spec.importantDetails.slice(0, 3));
  }

  // Add environment terms
  if (spec.environment) {
    const envWords = spec.environment.split(/[, ]+/).filter(w => w.length > 3);
    terms.push(...envWords.slice(0, 2));
  }

  // Deduplicate and limit
  return [...new Set(terms)].slice(0, 5);
}

/**
 * Build primary search query
 *
 * Stock search works best with 2-4 relevant terms rather than long
 * descriptive prompts.
 */
function buildPrimaryQuery(spec: VisualGenerationSpec): string {
  const terms = extractSearchTerms(spec);

  // Take top 3-4 terms for the primary query
  const primaryTerms = terms.slice(0, 4);

  return primaryTerms.join(" ");
}

/**
 * Build alternative queries for fallback
 *
 * If the primary query doesn't return good results, these alternatives
 * can be tried.
 */
function buildAlternativeQueries(spec: VisualGenerationSpec): string[] {
  const alternatives: string[] = [];
  const terms = extractSearchTerms(spec);

  // Alternative 1: Use subject + category
  if (terms.length >= 2) {
    alternatives.push(`${terms[0]} ${terms[1]}`);
  }

  // Alternative 2: Use subject alone
  if (terms.length >= 1) {
    alternatives.push(terms[0]);
  }

  // Alternative 3: Use subject + environment word
  if (spec.environment) {
    const envWord = spec.environment.split(/[, ]+/)[0];
    if (envWord && envWord.length > 3) {
      alternatives.push(`${terms[0]} ${envWord}`);
    }
  }

  // Alternative 4: Use category term
  const categoryTerms: Record<string, string> = {
    fitness: "fitness",
    nutrition: "healthy food",
    education: "education",
    technology: "technology",
    business: "business",
    finance: "finance",
    productivity: "productivity",
    lifestyle: "lifestyle",
    travel: "travel",
    motivation: "motivation",
    health: "health",
    general: "professional",
  };

  if (spec.category in categoryTerms) {
    alternatives.push(categoryTerms[spec.category]);
  }

  // Deduplicate and limit
  return [...new Set(alternatives)].slice(0, 3);
}

/**
 * Determine orientation from aspect ratio
 */
function mapAspectRatioToOrientation(aspectRatio: string): "square" | "landscape" | "portrait" {
  switch (aspectRatio) {
    case "1:1":
      return "square";
    case "16:9":
    case "3:2":
      return "landscape";
    case "9:16":
    case "2:3":
      return "portrait";
    default:
      return "square";
  }
}

/**
 * Determine color preference from color mood
 */
function mapColorMoodToColor(colorMood?: string): string | undefined {
  switch (colorMood) {
    case "warm":
      return "warm";
    case "cool":
      return "cool";
    case "vibrant":
      return "colorful";
    case "muted":
      return "neutral";
    case "monochrome":
      return "black and white";
    default:
      return undefined;
  }
}

/**
 * Create stock search specification from visual spec
 *
 * This transforms the detailed visual spec into a concise search query
 * appropriate for stock photo APIs.
 */
export function createStockSearchSpec(spec: VisualGenerationSpec): StockSearchSpec {
  const primaryQuery = buildPrimaryQuery(spec);
  const alternativeQueries = buildAlternativeQueries(spec);
  const orientation = mapAspectRatioToOrientation(spec.aspectRatio || "1:1");
  const color = mapColorMoodToColor(spec.colorMood);

  return {
    query: primaryQuery,
    alternativeQueries,
    orientation,
    size: "large", // Prefer high-quality images
    color,
  };
}

/**
 * Create stock search spec directly from topic (skip full analysis)
 *
 * This is a simplified path for when you only have a topic and want
 * a quick stock search without full visual analysis.
 */
export function createQuickStockSearchSpec(topic: string): StockSearchSpec {
  // Extract key words from topic
  const words = topic.split(/\s+/).filter(w => w.length > 3);
  const primaryTerms = words.slice(0, 3);
  const query = primaryTerms.join(" ");

  // Simple alternatives
  const alternatives: string[] = [];
  if (words.length >= 2) {
    alternatives.push(words.slice(0, 2).join(" "));
  }
  if (words.length >= 1) {
    alternatives.push(words[0]);
  }

  return {
    query,
    alternativeQueries: alternatives,
    orientation: "square",
    size: "large",
  };
}
