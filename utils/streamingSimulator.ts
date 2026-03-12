/**
 * Streaming Simulator - Provides smooth, realistic output streaming
 * Splits content into logical chunks (thinking → output → code)
 * and adds delays to simulate natural progression
 */

export interface StreamChunk {
  type: 'thinking' | 'text' | 'code';
  content: string;
  delay: number; // ms delay before rendering this chunk
}

/**
 * Parse response into logical chunks for smooth streaming
 */
export function parseStreamChunks(fullResponse: string): StreamChunk[] {
  const chunks: StreamChunk[] = [];
  let currentPos = 0;

  // Extract thinking block if present
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;
  const thinkMatch = fullResponse.match(thinkRegex);
  
  if (thinkMatch) {
    chunks.push({
      type: 'thinking',
      content: thinkMatch[1].trim(),
      delay: 0 // Start immediately
    });
    currentPos = thinkMatch.index! + thinkMatch[0].length;
  }

  // Extract code blocks
  const codeRegex = /```(?:jsx|tsx|jsx?|js|typescript)?\s*\n([\s\S]*?)```/g;
  let codeMatch;
  const codeMatches: Array<{start: number, end: number, code: string}> = [];
  
  while ((codeMatch = codeRegex.exec(fullResponse)) !== null) {
    codeMatches.push({
      start: codeMatch.index,
      end: codeMatch.index + codeMatch[0].length,
      code: codeMatch[1].trim()
    });
  }

  // Extract text content (everything except thinking and code blocks)
  let textContent = fullResponse;
  
  // Remove thinking blocks
  textContent = textContent.replace(/<think>[\s\S]*?<\/think>/g, '');
  
  // Remove code blocks
  textContent = textContent.replace(/```(?:jsx|tsx|jsx?|js|typescript)?\s*\n[\s\S]*?```/g, '');
  
  textContent = textContent.trim();

  // Add text chunk with delay (after thinking shows)
  if (textContent) {
    const thinkDelay = thinkMatch ? 500 : 0; // Wait 500ms after thinking starts
    chunks.push({
      type: 'text',
      content: textContent,
      delay: thinkDelay + 200 // Additional 200ms after thinking
    });
  }

  // Add code chunks with increasing delays
  let codeDelayOffset = textContent ? 800 : (thinkMatch ? 700 : 300);
  codeMatches.forEach((codeMatch, idx) => {
    chunks.push({
      type: 'code',
      content: codeMatch.code,
      delay: codeDelayOffset + (idx * 300) // Each code block gets 300ms delay between them
    });
  });

  return chunks;
}

/**
 * Stream content to output with simulated delays
 * Each chunk type gets its appropriate delay
 */
export async function simulateStreamingOutput(
  fullContent: string,
  onChunk: (content: string, type: 'thinking' | 'text' | 'code') => void,
  onCodeDetected?: (hasCode: boolean) => void
): Promise<void> {
  const chunks = parseStreamChunks(fullContent);
  
  // Check if there's code
  const hasCode = chunks.some(c => c.type === 'code');
  if (onCodeDetected) {
    onCodeDetected(hasCode);
  }

  for (const chunk of chunks) {
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, chunk.delay));
    
    // Send the chunk
    onChunk(chunk.content, chunk.type);
  }
}

/**
 * Streaming wrapper that gradually reveals content char by char
 * Useful for smooth text animation
 */
export async function streamCharByChar(
  content: string,
  onChar: (text: string) => void,
  charsPerMs: number = 1, // Characters per millisecond (default: instant)
  initialDelay: number = 0
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, initialDelay));
  
  let current = '';
  for (let i = 0; i < content.length; i++) {
    current += content[i];
    onChar(current);
    
    if (charsPerMs < 1) {
      await new Promise(resolve => setTimeout(resolve, 1 / charsPerMs));
    }
  }
}

/**
 * Combine thinking block streaming with main content streaming
 */
export async function streamWithThinkingFirst(
  response: string,
  onThinking: (thinking: string) => void,
  onContent: (content: string) => void,
  thinkingCharsPerMs: number = 2
): Promise<void> {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;
  const thinkMatch = response.match(thinkRegex);

  if (thinkMatch) {
    // Stream thinking block
    const thinking = thinkMatch[1].trim();
    await streamCharByChar(thinking, onThinking, thinkingCharsPerMs, 0);
    
    // Wait before showing main content
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Get non-thinking content
  let mainContent = response
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .trim();

  // Stream main content
  onContent(mainContent);
}

/**
 * Stream with word-by-word animation for text content
 */
export async function streamWordByWord(
  content: string,
  onWord: (text: string) => void,
  delayBetweenWords: number = 50
): Promise<void> {
  const words = content.split(/(\s+)/);
  let accumulated = '';
  
  for (const word of words) {
    accumulated += word;
    onWord(accumulated);
    
    if (word.trim().length > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenWords));
    }
  }
}
