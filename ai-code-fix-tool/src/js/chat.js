// Chat interface management - MODERN INTERFACE
import { state } from './state.js';
import { escapeHtml } from './logger.js';

export function addChatMessage(content, isUser = false) {
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return null;
  
  const messageDiv = document.createElement('div');
  
  // Use custom classes from index.html
  messageDiv.className = `message ${isUser ? 'message-user' : 'message-bot'}`;
  
  // If content is a custom component (like request-block), don't apply standard bubble styles
  if (content.trim().startsWith('<div class="request-block"')) {
    messageDiv.classList.add('no-style');
  }
  
  messageDiv.innerHTML = content;
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return messageDiv;
}

export function toggleChatPanel() {
  const panel = document.getElementById('chat-panel');
  const btn = document.getElementById('chat-toggle-text');
  
  if (!panel) return;
  
  state.chatPanelVisible = !panel.classList.contains('collapsed');
  
  if (state.chatPanelVisible) {
    panel.classList.add('collapsed');
    if (btn) btn.textContent = 'Show Chat';
    state.chatPanelVisible = false;
  } else {
    panel.classList.remove('collapsed');
    if (btn) btn.textContent = 'Hide Chat';
    state.chatPanelVisible = true;
  }
}

export function clearChat() {
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return;
  
  messagesContainer.innerHTML = '';
  addChatMessage('Chat cleared. How can I help you?');
}

export function parseAIResponse(text) {
  // Extract thinking/reasoning if present
  let thinking = '';
  let content = text;
  
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    thinking = thinkMatch[1].trim();
    // Also check if thinking tag is still open for streaming
    content = text.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
  } else if (text.includes('<think>')) {
    // Handling streaming of thinking block
    const split = text.split('<think>');
    thinking = split[1].trim();
    content = split[0].trim();
  }
  
  const codeBlockRegex = /```(?:jsx|tsx|javascript|js)?\n([\s\S]*?)```/g;
  const codeMatches = [...content.matchAll(codeBlockRegex)];
  const code = codeMatches.length > 0 ? codeMatches[0][1].trim() : '';
  
  const summaryMatch = content.match(/## Summary\n([\s\S]*?)(?=\n##|```|$)/i);
  const explanationMatch = content.match(/## Explanation\n([\s\S]*?)(?=\n##|$)/i);
  
  return {
    code,
    thinking,
    summary: summaryMatch ? summaryMatch[1].trim() : '',
    explanation: explanationMatch ? explanationMatch[1].trim() : '',
    hasContent: !!(summaryMatch || explanationMatch || code || thinking)
  };
}

export function formatAIResponse(parsed, rawText, metadata = {}) {
  if (!parsed.hasContent) {
    return `<div class="explanation-text">${marked.parse(rawText)}</div>`;
  }
  
  let html = '<div class="ai-response">';
  
  // Add Thinking block if present
  if (parsed.thinking) {
    html += `
      <div class="thinking-block">
        <details class="thinking-details" ${parsed.code ? '' : 'open'}>
          <summary class="thinking-summary">
            <i data-lucide="brain-circuit"></i>
            Reasoning Process
          </summary>
          <div class="thinking-content">${escapeHtml(parsed.thinking)}</div>
        </details>
      </div>
    `;
  }
  
  if (parsed.summary) {
    html += '<div class="response-section">';
    html += '<div class="section-header">Summary</div>';
    html += `<div class="explanation-text">${marked.parse(parsed.summary)}</div>`;
    html += '</div>';
  }
  
  if (parsed.explanation) {
    html += '<div class="response-section">';
    html += '<div class="section-header">Explanation</div>';
    html += `<div class="explanation-text">${marked.parse(parsed.explanation)}</div>`;
    html += '</div>';
  }
  
  // If no sections detected but we have raw text outside think tags, render it
  if (!parsed.summary && !parsed.explanation && !parsed.code) {
    const mainContent = rawText.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
    if (mainContent) {
      html += `<div class="explanation-text">${marked.parse(mainContent)}</div>`;
    }
  }

  // Add Token Metadata Badge
  const outTokens = Math.ceil(rawText.length / 4);
  const inTokens = metadata.inputTokens || 0;
  
  html += `
    <div class="message-meta">
      <div class="token-usage" title="Approximate token consumption">
        <span class="meta-label">Tokens:</span>
        <span class="token-pill in">${inTokens} in</span>
        <span class="token-pill out">${outTokens} out</span>
        <span class="token-total">${inTokens + outTokens} total</span>
      </div>
    </div>
  `;
  
  html += '</div>';
  
  // Re-run lucide icons if they exist in the new HTML
  setTimeout(() => {
    if (window.lucide) window.lucide.createIcons();
  }, 0);
  
  return html;
}

// Global auto-resize for chat input
document.addEventListener('input', (e) => {
  if (e.target.id === 'message-input') {
    e.target.style.height = 'auto';
    e.target.style.height = (e.target.scrollHeight) + 'px';
  }
});
