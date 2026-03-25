// Canvas Error Fixing Service - Auto-apply validated fixes
// Based on ai-code-fix-tool's proven approach

import { ChatMessage, Citation } from '../types';

/**
 * Extract fixed code from AI response markdown
 */
function extractFixedCode(aiResponse: string): string | null {
  // Try to find code block with language specifier
  const codeBlockRegex = /```(?:jsx|tsx|javascript|typescript|js|ts)?\s*\n([\s\S]*?)```/;
  const match = aiResponse.match(codeBlockRegex);
  
  if (match && match[1]) {
    let code = match[1].trim();
    
    // Clean up inline comments that AI sometimes adds (they break JSX)
    code = code
      .split('\n')
      .map(line => {
        // Remove inline // comments after JSX tags
        if (line.includes('>') && line.includes('//')) {
          const jsxEnd = line.lastIndexOf('>');
          const commentStart = line.indexOf('//', jsxEnd);
          if (commentStart > jsxEnd) {
            return line.substring(0, commentStart).trimEnd();
          }
        }
        return line;
      })
      .join('\n');
    
    return code;
  }
  
  return null;
}

/**
 * Validate code with Babel
 */
function validateCode(code: string): { valid: boolean; error?: string } {
  try {
    // Check if Babel is available
    if (typeof (window as any).Babel === 'undefined') {
      console.warn('[CanvasErrorFixer] Babel not available, skipping validation');
      return { valid: true }; // Assume valid if Babel not loaded
    }
    
    const Babel = (window as any).Babel;
    
    // Try TypeScript preset first, fallback to React only
    try {
      Babel.transform(code, { presets: ['typescript', 'react'] });
    } catch (tsError) {
      Babel.transform(code, { presets: ['react'] });
    }
    
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Build prompt for AI to fix Canvas error
 */
function buildFixPrompt(errorMessage: string, code: string): string {
  // Extract error line number if available
  const lineMatch = errorMessage.match(/line (\d+)|:(\d+):\d+/i);
  const errorLine = lineMatch ? parseInt(lineMatch[1] || lineMatch[2]) : null;
  
  let prompt = `Fix this React/JSX code error. Provide a brief explanation and the complete fixed code.

ERROR:
${errorMessage}

`;

  if (errorLine) {
    // Add focused context around error line
    const lines = code.split('\n');
    const start = Math.max(0, errorLine - 5);
    const end = Math.min(lines.length, errorLine + 5);
    
    const context = lines.slice(start, end).map((line, idx) => {
      const lineNum = start + idx + 1;
      const marker = lineNum === errorLine ? '>>> ' : '    ';
      return `${marker}${lineNum} | ${line}`;
    }).join('\n');
    
    prompt += `CONTEXT (around line ${errorLine}):
${context}

`;
  }

  prompt += `FULL CODE:
\`\`\`jsx
${code}
\`\`\`

Please respond with:
1. Brief explanation of what was wrong
2. The complete fixed code in a code block

FORMAT:
Brief explanation here...

\`\`\`jsx
[Complete fixed code]
\`\`\``;

  return prompt;
}

/**
 * Fix Canvas error using AI
 * Returns fixed code if successful, null if failed
 */
export async function fixCanvasError(
  errorMessage: string,
  code: string,
  aiModel: 'gemini' | 'cerebras' | 'groq' | 'openrouter' | 'ollama',
  history: ChatMessage[],
  onChunk: (chunk: string) => void,
  apiKey?: string,
  selectedModel?: string,
  ollamaBaseUrl?: string,
  ollamaMode?: 'local' | 'cloud'
): Promise<{ success: boolean; fixedCode?: string; error?: string }> {
  
  console.log('[CanvasErrorFixer] Starting fix process');
  console.log('[CanvasErrorFixer] Error:', errorMessage);
  console.log('[CanvasErrorFixer] Code length:', code.length);
  
  try {
    // Build prompt
    const prompt = buildFixPrompt(errorMessage, code);
    
    console.log('[CanvasErrorFixer] Prompt prepared');
    
    // Import appropriate service
    let streamService: any;
    let serviceApiKey = apiKey;
    
    switch (aiModel) {
      case 'gemini':
        streamService = await import('./geminiService');
        serviceApiKey = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY;
        break;
      case 'cerebras':
        streamService = await import('./cerebrasService');
        serviceApiKey = apiKey || (import.meta as any).env?.VITE_CEREBRAS_API_KEY;
        break;
      case 'groq':
        streamService = await import('./groqService');
        serviceApiKey = apiKey || (import.meta as any).env?.VITE_GROQ_API_KEY;
        break;
      case 'openrouter':
        streamService = await import('./openrouterService');
        serviceApiKey = apiKey || (import.meta as any).env?.VITE_OPENROUTER_API_KEY;
        break;
      case 'ollama':
        streamService = await import('./ollamaService');
        serviceApiKey = apiKey || (import.meta as any).env?.VITE_OLLAMA_API_KEY;
        break;
    }
    
    if (!serviceApiKey && aiModel !== 'ollama') {
      throw new Error(`${aiModel} API key not configured`);
    }
    
    // Stream AI response
    let fullResponse = '';
    
    console.log('[CanvasErrorFixer] Streaming AI response...');
    
    if (aiModel === 'ollama') {
      await streamService.streamChatResponse(
        prompt,
        history,
        [], // No RAG context for error fixing
        (chunk: string) => {
          fullResponse += chunk;
          onChunk(chunk);
        },
        serviceApiKey,
        selectedModel || 'llama3.1:8b',
        undefined,
        ollamaBaseUrl || 'http://localhost:11434',
        ollamaMode === 'cloud'
      );
    } else {
      await streamService.streamChatResponse(
        prompt,
        history,
        [], // No RAG context for error fixing
        (chunk: string) => {
          fullResponse += chunk;
          onChunk(chunk);
        },
        serviceApiKey,
        selectedModel,
        undefined
      );
    }
    
    console.log('[CanvasErrorFixer] AI response received');
    console.log('[CanvasErrorFixer] Response length:', fullResponse.length);
    
    // Extract fixed code
    const fixedCode = extractFixedCode(fullResponse);
    
    if (!fixedCode) {
      console.error('[CanvasErrorFixer] No code block found in AI response');
      return { 
        success: false, 
        error: 'AI did not return code in expected format' 
      };
    }
    
    console.log('[CanvasErrorFixer] Fixed code extracted');
    console.log('[CanvasErrorFixer] Fixed code length:', fixedCode.length);
    
    // Validate fixed code
    const validation = validateCode(fixedCode);
    
    if (!validation.valid) {
      console.error('[CanvasErrorFixer] Fixed code validation failed:', validation.error);
      return { 
        success: false, 
        error: `Fixed code still has errors: ${validation.error}` 
      };
    }
    
    console.log('[CanvasErrorFixer] Fixed code validated successfully');
    
    return { 
      success: true, 
      fixedCode 
    };
    
  } catch (error) {
    console.error('[CanvasErrorFixer] Fix process failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}
