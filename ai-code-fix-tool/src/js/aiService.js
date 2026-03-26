// AI service for code fixing - Multi-provider support
import { state, loadAPIKeys } from './state.js';
import { log, escapeHtml } from './logger.js';
import { addChatMessage, parseAIResponse, formatAIResponse } from './chat.js';
import { showDiff } from './diff.js';

// Import all AI provider services
import * as GroqService from './services/groqService.js';
import * as GeminiService from './services/geminiService.js';
import * as CerebrasService from './services/cerebrasService.js';
import * as OpenRouterService from './services/openrouterService.js';
import * as OllamaService from './services/ollamaService.js';

export async function startAIFix(errors, originalCode) {
  if (errors.length === 0 || state.isProcessing) return;
  
  log('=== AI FIX STARTED ===', 'info');
  log(`Using provider: ${state.selectedProvider}, model: ${state.selectedModel}`, 'info');
  log('Original code to fix:', 'info', originalCode);
  
  state.isProcessing = true;
  updateStatus('AI Processing...', 'processing');
  
  const errorsList = errors.map((err, i) => 
    `Error ${i + 1} (Line ${err.line}:${err.column}):\n${err.message}`
  ).join('\n\n');

  // Add highly visual request info to chat
  const requestHtml = `
    <div class="request-block">
      <details class="request-details">
        <summary class="request-summary">
          <i data-lucide="send"></i>
          Request: Fixing ${errors.length} error${errors.length > 1 ? 's' : ''}
        </summary>
        <div class="request-content">
          <div class="request-section-title">Detected Errors</div>
          <pre class="request-errors">${escapeHtml(errorsList)}</pre>
          <div class="request-section-title">Context Code</div>
          <pre class="request-code">${escapeHtml(originalCode.slice(0, 500))}${originalCode.length > 500 ? '...' : ''}</pre>
        </div>
      </details>
    </div>
  `;
  addChatMessage(requestHtml, true);
  
  // Estimate input tokens (rough characters/4 rule for UI)
  const inputTokens = Math.ceil((originalCode.length + errorsList.length + 200) / 4);

  log(`Calling ${state.selectedProvider.toUpperCase()} API`, 'info', { 
    provider: state.selectedProvider,
    model: state.selectedModel,
    errorCount: errors.length 
  });
  log('Errors to fix:', 'info', errorsList);

  // Check API keys - load if not present
  const currentApiKey = state.apiKeys[state.selectedProvider];
  if (!currentApiKey && state.selectedProvider !== 'ollama') {
    log('API key missing, attempting to load...', 'warning');
    await loadAPIKeys();
    
    if (!state.apiKeys[state.selectedProvider]) {
      log('API key still missing after load', 'error');
      const providerNames = {
        groq: 'Groq',
        gemini: 'Gemini',
        cerebras: 'Cerebras',
        openrouter: 'OpenRouter',
        ollama: 'Ollama'
      };
      alert(`${providerNames[state.selectedProvider]} API key not found!\n\nPlease configure your API key in Settings.`);
      state.isProcessing = false;
      updateStatus('Error', 'error');
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
    // Call appropriate provider service
    let response;
    const apiKey = state.apiKeys[state.selectedProvider];
    const model = state.selectedModel;

    switch (state.selectedProvider) {
      case 'groq':
        response = await GroqService.callGroqAPI(prompt, apiKey, model);
        break;
      case 'gemini':
        response = await GeminiService.callGeminiAPI(prompt, apiKey, model);
        break;
      case 'cerebras':
        response = await CerebrasService.callCerebrasAPI(prompt, apiKey, model);
        break;
      case 'openrouter':
        response = await OpenRouterService.callOpenRouterAPI(prompt, apiKey, model);
        break;
      case 'ollama':
        response = await OllamaService.callOllamaAPI(prompt, apiKey, model, state.ollamaBaseUrl);
        break;
      default:
        throw new Error(`Unknown provider: ${state.selectedProvider}`);
    }

    if (!response.ok && state.selectedProvider !== 'gemini') {
      log('API failed', 'error', { status: response.status });
      throw new Error(`API error: ${response.status}`);
    }

    log('API response received', 'success');
    await handleStreamingResponse(response, inputTokens);
    
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

async function handleStreamingResponse(response, inputTokens = 0) {
  log('Stream processing started', 'info');
  
  const aiMessageBubble = addChatMessage('<div class="streaming-indicator"></div>');
  let fullResponse = '';
  
  try {
    // Use provider-specific streaming handler
    const service = getProviderService(state.selectedProvider);
    fullResponse = await service.handleStreamingResponse(
      response, 
      aiMessageBubble, 
      parseAIResponse, 
      (parsed, raw) => formatAIResponse(parsed, raw, { inputTokens })
    );
    
    log('Stream ended', 'success', { length: fullResponse.length });
    log('Complete AI response:', 'info', fullResponse);
    
  } catch (error) {
    log('Stream processing error', 'error', { error: error.message });
    throw error;
  }
  
  const finalParsed = parseAIResponse(fullResponse);
  log('Response parsed', 'info', { hasCode: !!finalParsed.code });
  
  if (finalParsed.code) {
    log('Validating fixed code received from AI...', 'info', { 
      codeLength: finalParsed.code.length,
      isAutoAccept: document.getElementById('auto-accept-toggle')?.checked 
    });
    
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
    
    state.suggestedCode = cleanedCode;
    
    // 1. APPLY IMMEDIATELY (Insert into editor first as requested)
    log('Applying AI suggestion to editor...', 'debug');
    showDiff(state.originalCode, state.suggestedCode);
    
    // 2. VALIDATE SECOND (Let the pipeline run naturally)
    try {
      try {
        Babel.transform(cleanedCode, { presets: ['typescript', 'react'] });
      } catch (tsError) {
        Babel.transform(cleanedCode, { presets: ['react'] });
      }
      updateStatus('Fix Applied', 'success');
      log('Fixed code successfully processed and editor updated', 'success');
    } catch (e) {
      updateStatus('Fix Ready (with lens)', 'warning');
      addChatMessage('[NOTICE] AI suggestion applied, but it contains syntax errors that need manual adjustment.');
      log('CODE VALIDATION WARNING: AI response contains syntax errors', 'warning', { 
        error: e.message
      });
    }
  } else {
    log('NO CODE FOUND IN AI RESPONSE: The AI might have only sent an explanation without a code block.', 'warning');
    addChatMessage('[WARNING] AI did not return a valid code block. Check the chat history.');
  }
  
  state.isProcessing = false;
}

// Get provider service module
function getProviderService(provider) {
  switch (provider) {
    case 'groq': return GroqService;
    case 'gemini': return GeminiService;
    case 'cerebras': return CerebrasService;
    case 'openrouter': return OpenRouterService;
    case 'ollama': return OllamaService;
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}

// Export models for UI
export function getAvailableModels(provider) {
  switch (provider) {
    case 'groq': return GroqService.GROQ_MODELS;
    case 'gemini': return GeminiService.GEMINI_MODELS;
    case 'cerebras': return CerebrasService.CEREBRAS_MODELS;
    case 'openrouter': return OpenRouterService.OPENROUTER_MODELS;
    case 'ollama': return OllamaService.OLLAMA_LOCAL_MODELS;
    default: return [];
  }
}

export function updateStatus(text, type = 'success') {
  const badge = document.getElementById('status-badge');
  badge.textContent = text;
  badge.className = `status-badge ${type}`;
}
