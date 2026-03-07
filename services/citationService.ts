/**
 * Citation Service
 * Handles extraction, validation, and management of structured citations
 */

export interface Citation {
  index: number;
  filename: string;
  location: string;
  quote: string;
  startPos: number;
  endPos: number;
}

// Regex patterns for citation parsing
export const SPLIT_REGEX = /((?:\{\{|【)citation:[^}】]*(?:\}\}|】))/g;
export const MATCH_REGEX = /(?:\{\{|【)citation:([^|]*?)\|([^|]*?)\|([^}】]*?)(?:\}\}|】)/s;

let citationCounter = 0;

export const resetCitationCounter = () => {
  citationCounter = 0;
};

export const incrementCitationCounter = () => {
  citationCounter++;
  return citationCounter - 1;
};

export const getCitationCounter = () => citationCounter;

/**
 * Extract all citations from text
 */
export const extractCitations = (text: string): Citation[] => {
  const citations: Citation[] = [];
  const citationMatches = text.matchAll(new RegExp(MATCH_REGEX.source, 'g'));
  
  let index = 0;
  for (const match of citationMatches) {
    if (match[0] && match[1] && match[2] && match[3]) {
      citations.push({
        index,
        filename: match[1].trim(),
        location: match[2].trim(),
        quote: match[3].trim(),
        startPos: match.index || 0,
        endPos: (match.index || 0) + match[0].length
      });
      index++;
    }
  }
  
  return citations;
};

/**
 * Validate citation format
 */
export const validateCitation = (citation: string): boolean => {
  const match = citation.match(MATCH_REGEX);
  if (!match) return false;
  
  const [, filename, location, quote] = match;
  return !!(filename?.trim() && location?.trim() && quote?.trim());
};

/**
 * Extract unique source files from text
 */
export const extractSourceFiles = (text: string): Set<string> => {
  const citations = extractCitations(text);
  const sourceFiles = new Set<string>();
  
  citations.forEach(citation => {
    sourceFiles.add(citation.filename);
  });
  
  return sourceFiles;
};

/**
 * Check if citation is a URL
 */
export const isUrlCitation = (source: string): boolean => {
  return source.startsWith('http://') || source.startsWith('https://');
};

/**
 * Replace citations with numbered chips in text
 * Returns array of text segments and citation objects
 */
export interface TextSegment {
  type: 'text' | 'citation';
  content: string;
  citation?: Citation;
  citationNumber?: number;
}

export const parseTextWithCitations = (text: string): TextSegment[] => {
  const segments: TextSegment[] = [];
  const parts = text.split(SPLIT_REGEX);
  let citationIndex = 0;
  
  for (const part of parts) {
    if (!part) continue;
    
    const match = part.match(MATCH_REGEX);
    if (match && match[1] && match[2] && match[3]) {
      // This is a citation
      segments.push({
        type: 'citation',
        content: part,
        citation: {
          index: citationIndex,
          filename: match[1].trim(),
          location: match[2].trim(),
          quote: match[3].trim(),
          startPos: 0,
          endPos: part.length
        },
        citationNumber: citationIndex
      });
      citationIndex++;
    } else {
      // This is regular text
      segments.push({
        type: 'text',
        content: part
      });
    }
  }
  
  return segments;
};

/**
 * Format citation for display
 */
export const formatCitationDisplay = (citation: Citation): string => {
  return `${citation.filename} • ${citation.location}`;
};

/**
 * Get citation preview text
 */
export const getCitationPreview = (citation: Citation, maxLength: number = 100): string => {
  const quote = citation.quote.trim();
  if (quote.length <= maxLength) {
    return quote;
  }
  return quote.substring(0, maxLength) + '...';
};
