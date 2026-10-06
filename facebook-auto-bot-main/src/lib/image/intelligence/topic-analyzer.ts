/**
 * Topic Analyzer
 *
 * Analyzes user topics to extract visual understanding without requiring
 * external AI calls. This uses rule-based analysis that can be enhanced
 * with AI in the future.
 *
 * The goal is to transform raw topic strings into structured visual concepts
 * that guide image generation toward relevant, diverse, and appropriate visuals.
 */

/**
 * Topic category for routing visual decisions
 */
export type TopicCategory =
  | "health"
  | "fitness"
  | "nutrition"
  | "education"
  | "technology"
  | "business"
  | "finance"
  | "productivity"
  | "lifestyle"
  | "travel"
  | "motivation"
  | "science"
  | "environment"
  | "news"
  | "tutorial"
  | "product"
  | "social"
  | "general";

/**
 * Structured understanding of a topic
 */
export interface TopicUnderstanding {
  /** Original topic text */
  originalTopic: string;
  /** Detected category */
  category: TopicCategory;
  /** Primary subject of the topic */
  primarySubject: string;
  /** Type of subject (person, object, concept, action) */
  subjectType: "person" | "object" | "concept" | "action" | "scene";
  /** Main action or activity (if applicable) */
  action?: string;
  /** Context or setting for the topic */
  context?: string;
  /** Target audience (if discernible) */
  audience?: string;
  /** Emotional tone of the topic */
  emotionalTone: "positive" | "neutral" | "negative" | "mixed";
  /** User intent (educational, promotional, informational, inspirational) */
  intent: "educational" | "promotional" | "informational" | "inspirational" | "general";
  /** Important visual keywords to prioritize */
  visualKeywords: string[];
  /** Elements to avoid in the image */
  forbiddenOrAvoidedElements: string[];
  /** Suggested composition approach */
  suggestedComposition: "close-up" | "medium-shot" | "wide-scene" | "environmental" | "action";
  /** Suggested visual style */
  suggestedStyle: "photorealistic" | "lifestyle" | "editorial" | "minimal" | "cinematic";
  /** Suggested color mood */
  suggestedColorMood: "warm" | "cool" | "neutral" | "vibrant" | "muted";
}

/**
 * Keyword patterns for topic categorization
 */
const CATEGORY_PATTERNS: Record<TopicCategory, RegExp[]> = {
  health: [
    /\b(health|wellness|medical|doctor|hospital|medicine|treatment|disease|symptom|care)\b/i,
    /\b(hydration|sleep|mental|stress|anxiety|depression|therapy)\b/i,
  ],
  fitness: [
    /\b(exercise|workout|fitness|gym|training|cardio|strength|muscle|athlete|runner)\b/i,
    /\b(yoga|pilates|crossfit|swimming|cycling|jogging|sprinting)\b/i,
  ],
  nutrition: [
    /\b(food|diet|nutrition|protein|carb|calorie|meal|recipe|cooking|eat|drink)\b/i,
    /\b(breakfast|lunch|dinner|snack|healthy|organic|vegan|vegetarian)\b/i,
  ],
  education: [
    /\b(learn|teach|study|school|university|college|course|lesson|class|student)\b/i,
    /\b(knowledge|skill|training|tutorial|education|academic|learning)\b/i,
  ],
  technology: [
    /\b(ai|artificial|intelligence|machine learning|software|app|code|programming|tech)\b/i,
    /\b(digital|automation|robot|smart|computer|internet|data|algorithm)\b/i,
  ],
  business: [
    /\b(business|company|startup|entrepreneur|marketing|sales|growth|revenue)\b/i,
    /\b(strategy|brand|customer|client|enterprise|corporate|startup)\b/i,
  ],
  finance: [
    /\b(money|finance|investment|savings|budget|debt|credit|bank|loan|tax)\b/i,
    /\b(financial|wealth|income|expense|profit|cost|price|market)\b/i,
  ],
  productivity: [
    /\b(productivity|efficient|focus|time|manage|organize|plan|goal|habit|routine)\b/i,
    /\b(workflow|deadline|priority|task|project|schedule|calendar)\b/i,
  ],
  lifestyle: [
    /\b(lifestyle|daily|routine|habit|home|living|simple|minimal|quality)\b/i,
    /\b(self-care|balance|mindful|wellbeing|happiness|personal)\b/i,
  ],
  travel: [
    /\b(travel|trip|vacation|journey|adventure|explore|destination|tour|visit)\b/i,
    /\b(beach|mountain|city|country|culture|experience|discover)\b/i,
  ],
  motivation: [
    /\b(motivation|inspire|success|achieve|goal|dream|ambition|mindset|believe)\b/i,
    /\b(confidence|courage|determination|perseverance|overcome|growth)\b/i,
  ],
  science: [
    /\b(science|research|study|experiment|discovery|innovation|theory|physics|biology)\b/i,
    /\b(chemistry|nature|environmental|climate|energy|space|universe)\b/i,
  ],
  environment: [
    /\b(environment|climate|sustainability|green|eco|recycle|nature|planet|earth)\b/i,
    /\b(solar|renewable|pollution|waste|conservation|carbon|footprint)\b/i,
  ],
  news: [
    /\b(news|update|report|breaking|latest|current|event|headline|story)\b/i,
  ],
  tutorial: [
    /\b(how to|guide|step by step|instruction|tips|tricks|hack|method)\b/i,
    /\b(learn how|master|beginner|advanced|expert)\b/i,
  ],
  product: [
    /\b(product|item|tool|device|gadget|feature|review|best|top|recommend)\b/i,
  ],
  social: [
    /\b(social|community|relationship|friend|family|connection|network|people)\b/i,
  ],
  general: [],
};

/**
 * Detect category from topic
 */
function detectCategory(topic: string): TopicCategory {
  const lowerTopic = topic.toLowerCase();

  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (patterns.length === 0) continue;
    for (const pattern of patterns) {
      if (pattern.test(lowerTopic)) {
        return category as TopicCategory;
      }
    }
  }

  return "general";
}

/**
 * Extract primary subject from topic
 */
function extractPrimarySubject(topic: string): string {
  // Remove common words and extract main noun phrases
  const words = topic.split(/\s+/);
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "how", "what", "why", "when", "where", "tips", "ideas", "ways", "best",
  ]);

  const meaningfulWords = words.filter(w => !stopWords.has(w.toLowerCase()));
  if (meaningfulWords.length === 0) return topic;

  // Return first 2-3 meaningful words as subject
  return meaningfulWords.slice(0, 3).join(" ");
}

/**
 * Detect subject type
 */
function detectSubjectType(topic: string): TopicUnderstanding["subjectType"] {
  const lowerTopic = topic.toLowerCase();

  // People-related
  if (/\b(person|people|man|woman|child|kid|athlete|worker|student|doctor|teacher)\b/i.test(topic)) {
    return "person";
  }

  // Action-related
  if (/\b(run|walk|exercise|work|cook|eat|drink|sleep|study|travel|play|dance)\b/i.test(topic)) {
    return "action";
  }

  // Abstract concepts
  if (/\b(success|motivation|productivity|efficiency|growth|mindset|belief|confidence)\b/i.test(topic)) {
    return "concept";
  }

  // Objects
  if (/\b(tool|device|product|food|drink|equipment|machine|computer|phone)\b/i.test(topic)) {
    return "object";
  }

  // Default to scene/environment
  return "scene";
}

/**
 * Detect emotional tone
 */
function detectEmotionalTone(topic: string): TopicUnderstanding["emotionalTone"] {
  const positiveWords = ["success", "benefit", "improve", "better", "happy", "healthy", "good", "great", "best", "win", "achieve"];
  const negativeWords = ["problem", "issue", "fail", "bad", "worse", "stress", "anxiety", "pain", "loss", "risk", "danger"];

  const positiveCount = positiveWords.filter(w => topic.toLowerCase().includes(w)).length;
  const negativeCount = negativeWords.filter(w => topic.toLowerCase().includes(w)).length;

  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  if (positiveCount > 0 && negativeCount > 0) return "mixed";
  return "neutral";
}

/**
 * Detect user intent
 */
function detectIntent(topic: string): TopicUnderstanding["intent"] {
  if (/\b(benefits|advantages|why|importance|impact|effect)\b/i.test(topic)) {
    return "educational";
  }
  if (/\b(best|top|recommend|review|product|buy|get)\b/i.test(topic)) {
    return "promotional";
  }
  if (/\b(tips|ideas|ways|how to|guide|tutorial)\b/i.test(topic)) {
    return "informational";
  }
  if (/\b(motivation|inspire|success|achieve|dream|goal)\b/i.test(topic)) {
    return "inspirational";
  }

  return "general";
}

/**
 * Extract visual keywords
 */
function extractVisualKeywords(topic: string, category: TopicCategory): string[] {
  const keywords: string[] = [];

  // Category-specific keywords
  const categoryKeywords: Record<TopicCategory, string[]> = {
    health: ["wellness", "healthy", "care", "vitality", "lifestyle"],
    fitness: ["exercise", "active", "movement", "training", "strength"],
    nutrition: ["food", "meal", "fresh", "natural", "ingredients"],
    education: ["learning", "knowledge", "study", "academic", "skill"],
    technology: ["digital", "modern", "innovation", "tech", "smart"],
    business: ["professional", "corporate", "office", "growth", "strategy"],
    finance: ["money", "investment", "savings", "financial", "wealth"],
    productivity: ["focus", "organized", "efficient", "planning", "workflow"],
    lifestyle: ["daily", "routine", "balanced", "quality", "mindful"],
    travel: ["adventure", "destination", "journey", "explore", "scenic"],
    motivation: ["success", "achievement", "growth", "positive", "determined"],
    science: ["research", "discovery", "innovation", "laboratory", "experiment"],
    environment: ["nature", "green", "sustainable", "eco", "outdoor"],
    news: ["current", "breaking", "update", "report", "information"],
    tutorial: ["step-by-step", "guide", "instruction", "learning", "process"],
    product: ["item", "tool", "device", "feature", "quality"],
    social: ["community", "connection", "people", "together", "relationship"],
    general: ["professional", "quality", "modern", "clean", "simple"],
  };

  keywords.push(...categoryKeywords[category]);

  // Extract meaningful words from topic
  const topicWords = topic.split(/\s+/).filter(w => w.length > 3);
  keywords.push(...topicWords.slice(0, 5));

  // Deduplicate
  return [...new Set(keywords)];
}

/**
 * Determine forbidden elements based on category
 */
function determineForbiddenElements(category: TopicCategory): string[] {
  const baseForbidden = ["text", "watermark", "logo", "collage", "grid", "border", "frame"];

  const categorySpecific: Record<TopicCategory, string[]> = {
    health: ["graphic medical imagery", "scary", "horror"],
    fitness: ["unrealistic anatomy", "distorted poses"],
    nutrition: ["fake food", "plastic props"],
    education: ["complex charts", "dense text"],
    technology: ["glitch", "cyberpunk neon", "futuristic cliches"],
    business: ["generic stock office", "fake laptop screens"],
    finance: ["gambling", "casino"],
    productivity: ["clutter", "messy desk"],
    lifestyle: ["staged poses", "unnatural expressions"],
    travel: ["tourist traps", "crowds"],
    motivation: ["generic success imagery", "trophies"],
    science: ["fictional elements", "unrealistic depictions"],
    environment: ["pollution imagery", "destruction"],
    news: ["fake headlines", "misleading imagery"],
    tutorial: ["confusing layouts", "cluttered scenes"],
    product: ["unrelated objects", "distracting backgrounds"],
    social: ["staged interactions", "fake emotions"],
    general: [],
  };

  return [...baseForbidden, ...categorySpecific[category]];
}

/**
 * Suggest composition based on category and subject type
 */
function suggestComposition(category: TopicCategory, subjectType: TopicUnderstanding["subjectType"]): TopicUnderstanding["suggestedComposition"] {
  if (subjectType === "person") return "medium-shot";
  if (subjectType === "action") return "action";
  if (category === "travel" || category === "environment") return "wide-scene";
  if (category === "product") return "close-up";
  return "environmental";
}

/**
 * Suggest visual style based on category
 */
function suggestStyle(category: TopicCategory): TopicUnderstanding["suggestedStyle"] {
  const styleMap: Record<TopicCategory, TopicUnderstanding["suggestedStyle"]> = {
    health: "lifestyle",
    fitness: "lifestyle",
    nutrition: "photorealistic",
    education: "editorial",
    technology: "minimal",
    business: "editorial",
    finance: "editorial",
    productivity: "minimal",
    lifestyle: "lifestyle",
    travel: "cinematic",
    motivation: "cinematic",
    science: "editorial",
    environment: "cinematic",
    news: "editorial",
    tutorial: "minimal",
    product: "photorealistic",
    social: "lifestyle",
    general: "photorealistic",
  };

  return styleMap[category];
}

/**
 * Suggest color mood based on category and emotional tone
 */
function suggestColorMood(category: TopicCategory, emotionalTone: TopicUnderstanding["emotionalTone"]): TopicUnderstanding["suggestedColorMood"] {
  if (emotionalTone === "positive") return "warm";
  if (emotionalTone === "negative") return "muted";
  if (category === "technology" || category === "business") return "cool";
  if (category === "environment" || category === "travel") return "vibrant";
  return "neutral";
}

/**
 * Main analysis function
 */
export function analyzeTopic(topic: string): TopicUnderstanding {
  const category = detectCategory(topic);
  const primarySubject = extractPrimarySubject(topic);
  const subjectType = detectSubjectType(topic);
  const emotionalTone = detectEmotionalTone(topic);
  const intent = detectIntent(topic);
  const visualKeywords = extractVisualKeywords(topic, category);
  const forbiddenElements = determineForbiddenElements(category);
  const suggestedComposition = suggestComposition(category, subjectType);
  const suggestedStyle = suggestStyle(category);
  const suggestedColorMood = suggestColorMood(category, emotionalTone);

  return {
    originalTopic: topic,
    category,
    primarySubject,
    subjectType,
    emotionalTone,
    intent,
    visualKeywords,
    forbiddenOrAvoidedElements: forbiddenElements,
    suggestedComposition,
    suggestedStyle,
    suggestedColorMood,
  };
}
