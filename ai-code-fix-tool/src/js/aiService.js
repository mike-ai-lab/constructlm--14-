// AI service for code fixing
import { state, loadAPIKey } from './state.js';
import { log } from './logger.js';
import { addChatMessage, parseAIResponse, formatAIResponse } from './chat.js';
import { showDiff } from './diff.js';

export async function startAIFix(errors, originalCode) {
  if (errors.length === 0 || state.isProcessing) return;
  
  log('=== AI FIX STARTED ===', 'info');
  log('Original code to fix:', 'info', originalCode);
  
  state.isProcessing = true;
  updateStatus('AI Processing...', 'processing');
  
  addChatMessage('Generating fix...', true);
  
  const errorsList = errors.map((err, i) => 
    `Error ${i + 1} (Line ${err.line}:${err.column}):\n${err.message}`
  ).join('\n\n');

  log('Calling Groq API', 'info', { errorCount: errors.length });
  log('Errors to fix:', 'info', errorsList);

  // Check API key
  if (!state.apiKey) {
    const key = loadAPIKey();
    if (!key) {
      log('API key missing', 'error');
      alert('API key not found!\n\nPlease edit src/js/config.js and add your Groq API key to the API_KEYS.GROQ field.');
      state.isProcessing = false;
      return { success: false };
    }
  }

  const prompt = `Fix this React/JSX code. Provide explanation in sections.

FORMAT:
## Summary
- List fixes with line numbers

## Fixed Code
\`\`\`jsx
[Complete fixed code]
\`\`\`

## Explanation
Explain what was wrong and why.

ERRORS (${errors.length}):
${errorsList}

CODE:
\`\`\`jsx
${originalCode}
\`\`\``;

  log('Prompt prepared', 'debug', { 
    promptLength: prompt.length,
    estimatedTokens: Math.ceil(prompt.length / 4),
    codeLines: originalCode.split('\n').length
  });
  log('Full prompt sent to AI:', 'debug', prompt);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
        stream: true
      })
    });

    if (!response.ok) {
      log('API failed', 'error', { status: response.status });
      throw new Error(`API error: ${response.status}`);
    }

    log('API response received', 'success');
    await handleStreamingResponse(response);
    
    log('=== AI FIX COMPLETED ===', 'info');
    return { success: true };
    
  } catch (error) {
    log('AI Fix failed', 'error', { error: error.message });
    updateStatus('Error', 'error');
    addChatMessage(`Error: ${error.message}`);
    state.isProcessing = false;
    return { success: false, error: error.message };
  }
}

async function handleStreamingResponse(response) {
  log('Stream processing started', 'info');
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullResponse = '';
  let chunkCount = 0;
  
  const aiMessageBubble = addChatMessage('<div class="streaming-indicator"></div>');
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      log('Stream ended', 'success', { chunks: chunkCount, length: fullResponse.length });
      log('Complete AI response:', 'info', fullResponse);
      break;
    }
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            chunkCount++;
            fullResponse += content;
            state.currentAIResponse = fullResponse;
            
            const parsed = parseAIResponse(fullResponse);
            aiMessageBubble.innerHTML = formatAIResponse(parsed, fullResponse);
          }
        } catch (e) {
          log('Stream parse error', 'warning', { error: e.message });
        }
      }
    }
  }
  
  const finalParsed = parseAIResponse(fullResponse);
  log('Response parsed', 'info', { hasCode: !!finalParsed.code });
  
  if (finalParsed.code) {
    log('Validating fixed code', 'info');
    
    // Strip inline comments that AI sometimes adds (they break JSX)
    let cleanedCode = finalParsed.code
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
    
    log('Fixed code from AI:', 'info', cleanedCode);
    
    try {
      // Try TypeScript preset first, fallback to React only
      try {
        Babel.transform(cleanedCode, { presets: ['typescript', 'react'] });
      } catch (tsError) {
        Babel.transform(cleanedCode, { presets: ['react'] });
      }
      state.suggestedCode = cleanedCode;
      updateStatus('Fix Ready', 'success');
      showDiff(state.originalCode, state.suggestedCode);
      log('Fixed code is valid', 'success');
    } catch (e) {
      updateStatus('Fix Failed', 'error');
      addChatMessage('⚠️ Fixed code still has errors.');
      log('Fixed code invalid', 'error', { error: e.message });
    }
  }
  
  state.isProcessing = false;
}

export function updateStatus(text, type = 'success') {
  const badge = document.getElementById('status-badge');
  badge.textContent = text;
  badge.className = `status-badge ${type}`;
}
