import { Port } from '../types';

/**
 * Normalizes text by converting to lowercase and stripping accents / diacritics.
 * e.g., "Málaga" -> "malaga", "Gijón" -> "gijon", "Cádiz" -> "cadiz"
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Computes Levenshtein edit distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Similarity ratio between 0 and 1
 */
export function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(a, b);
  return 1 - dist / maxLen;
}

export interface SearchResult {
  port: Port;
  score: number;
  matchType: 'exact' | 'prefix' | 'contains' | 'fuzzy';
  isFuzzyTypoFix?: boolean;
}

/**
 * Smart fuzzy & typo-tolerant port search
 */
export function searchPorts(ports: Port[], rawQuery: string): SearchResult[] {
  const query = normalizeText(rawQuery);
  if (!query) return [];

  const results: SearchResult[] = [];

  for (const port of ports) {
    const normName = normalizeText(port.name);
    const normRegion = normalizeText(port.region);
    const normCountry = normalizeText(port.country);

    // Extract individual clean words from port name
    const nameWords = normName.split(/[\s,()/\\-]+/).filter(Boolean);

    let maxScore = 0;
    let matchType: 'exact' | 'prefix' | 'contains' | 'fuzzy' = 'contains';
    let isFuzzyTypoFix = false;

    // 1. Exact match on full name or words
    if (normName === query || nameWords.some(w => w === query)) {
      maxScore = 100;
      matchType = 'exact';
    }
    // 2. Prefix match (port name or region starts with query)
    else if (normName.startsWith(query) || nameWords.some(w => w.startsWith(query))) {
      maxScore = 90;
      matchType = 'prefix';
    }
    // 3. Substring inclusion
    else if (normName.includes(query) || normRegion.includes(query) || normCountry.includes(query)) {
      maxScore = 75;
      matchType = 'contains';
    }
    // 4. Fuzzy & Typo tolerance check
    else if (query.length >= 3) {
      // Compare query against full name and individual name words
      let bestWordSimilarity = 0;
      
      const fullSim = calculateSimilarity(query, normName);
      bestWordSimilarity = Math.max(bestWordSimilarity, fullSim);

      for (const word of nameWords) {
        if (word.length >= 3) {
          const sim = calculateSimilarity(query, word);
          if (sim > bestWordSimilarity) {
            bestWordSimilarity = sim;
          }
        }
      }

      // Also check similarity against region
      const regionSim = calculateSimilarity(query, normRegion);
      if (regionSim > bestWordSimilarity) {
        bestWordSimilarity = regionSim;
      }

      if (bestWordSimilarity >= 0.60) {
        maxScore = Math.round(bestWordSimilarity * 65); // Scores between ~39 and 65
        matchType = 'fuzzy';
        isFuzzyTypoFix = true;
      }
    }

    if (maxScore > 0) {
      // Boost popular ports slightly if scores are tied
      const finalScore = maxScore + (port.isPopular ? 2 : 0);
      results.push({
        port,
        score: finalScore,
        matchType,
        isFuzzyTypoFix
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}
