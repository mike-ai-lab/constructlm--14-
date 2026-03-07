/**
 * Citation Validator & Fixer
 * Ensures consistent citation format across all AI models
 * Handles malformed citations and provides fallbacks
 */

import { MATCH_REGEX, SPLIT_REGEX } from './citationService';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fixedText?: string;
  citationCount: number;
}

/**
 * Validate citation format
 */
export const validateCitationFormat = (citation: string): boolean => {
  const match = citation.match(MATCH_REGEX);
  if (!match) return false;
  
  const [, filename, location, quote] = match;
  
  // All three components must be present and non-empty
  if (!filename?.trim() || !location?.trim() || !quote?.trim()) {
    return false;
  }
  
  // Quote should not be too long (max 150 chars)
  if (quote.trim().length > 150) {
    return false;
  }
  
  return true;
};

/**
 * Extract all citations from text and validate each one
 */
export const validateAllCitations = (text: string): ValidationResult => {
  const errors: string[] = [];
  const citationMatches = text.match(SPLIT_REGEX) || [];
  let validCount = 0;
  
  citationMatches.forEach((citation, idx) => {
    if (!validateCitationFormat(citation)) {
      errors.push(`Citation ${idx + 1} has invalid format: ${citation.substring(0, 50)}...`);
    } else {
      validCount++;
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    citationCount: validCount
  };
};

/**
 * Fix common citation format issues
 */
export const fixCitationFormat = (text: string): string => {
  let fixed = text;
  
  // Fix: [cite:...] → {{citation:...}}
  fixed = fixed.replace(/\[cite:([^\]]+)\]/g, '{{citation:$1}}');
  
  // Fix: citation:... (without brackets) → {{citation:...}}
  fixed = fixed.replace(/(?<!\{)citation:([^}]+)(?!\})/g, '{{citation:$1}}');
  
  // Fix: {{citation:file.pdf}} (missing location and quote) → remove it
  fixed = fixed.replace(/\{\{citation:([^|]+)\}\}/g, '');
  
  // Fix: {{citation:file.pdf|Page 3}} (missing quote) → remove it
  fixed = fixed.replace(/\{\{citation:([^|]+)\|([^|]+)\}\}/g, '');
  
  // Fix: "default export" syntax errors (shouldn't be in citations but just in case)
  fixed = fixed.replace(/default\s+export\s+/g, 'export default ');
  
  // Fix: Multiple spaces in citations
  fixed = fixed.replace(/\{\{citation:([^|]+)\|([^|]+)\|([^}]+)\}\}/g, (match, file, loc, quote) => {
    return `{{citation:${file.trim()}|${loc.trim()}|${quote.trim()}}}`;
  });
  
  return fixed;
};

/**
 * Validate and fix text with citations
 */
export const validateAndFixCitations = (text: string): { text: string; result: ValidationResult } => {
  // First validate
  const initialValidation = validateAllCitations(text);
  
  // If already valid, return as-is
  if (initialValidation.isValid) {
    return {
      text,
      result: initialValidation
    };
  }
  
  // Try to fix
  const fixedText = fixCitationFormat(text);
  
  // Validate fixed text
  const finalValidation = validateAllCitations(fixedText);
  
  return {
    text: fixedText,
    result: {
      ...finalValidation,
      fixedText: fixedText !== text ? fixedText : undefined
    }
  };
};

/**
 * Extract citations with validation
 */
export const extractValidCitations = (text: string): Array<{
  filename: string;
  location: string;
  quote: string;
  isValid: boolean;
}> => {
  const citations: Array<{
    filename: string;
    location: string;
    quote: string;
    isValid: boolean;
  }> = [];
  
  const citationMatches = text.match(SPLIT_REGEX) || [];
  
  citationMatches.forEach(citation => {
    const match = citation.match(MATCH_REGEX);
    if (match && match[1] && match[2] && match[3]) {
      const isValid = validateCitationFormat(citation);
      citations.push({
        filename: match[1].trim(),
        location: match[2].trim(),
        quote: match[3].trim(),
        isValid
      });
    }
  });
  
  return citations;
};

/**
 * Check if text has any citation format issues
 */
export const hasCitationIssues = (text: string): boolean => {
  const validation = validateAllCitations(text);
  return !validation.isValid;
};

/**
 * Get citation statistics
 */
export const getCitationStats = (text: string): {
  totalCitations: number;
  validCitations: number;
  invalidCitations: number;
  validPercentage: number;
} => {
  const citations = extractValidCitations(text);
  const validCount = citations.filter(c => c.isValid).length;
  const invalidCount = citations.length - validCount;
  
  return {
    totalCitations: citations.length,
    validCitations: validCount,
    invalidCitations: invalidCount,
    validPercentage: citations.length > 0 ? (validCount / citations.length) * 100 : 0
  };
};

/**
 * Log citation validation for debugging
 */
export const logCitationValidation = (text: string, modelName: string): void => {
  const stats = getCitationStats(text);
  const validation = validateAllCitations(text);
  
  console.log(`[Citation Validation] Model: ${modelName}`);
  console.log(`  Total citations: ${stats.totalCitations}`);
  console.log(`  Valid: ${stats.validCitations}`);
  console.log(`  Invalid: ${stats.invalidCitations}`);
  console.log(`  Valid %: ${stats.validPercentage.toFixed(1)}%`);
  
  if (!validation.isValid) {
    console.warn(`  Errors:`, validation.errors);
  }
};
