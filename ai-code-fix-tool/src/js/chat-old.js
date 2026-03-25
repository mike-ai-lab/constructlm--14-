// Chat interface management - MODERN INTERFACE
import { state } from './state.js';
import { escapeHtml } from './logger.js';

export function addChatMessage(content, isUser = false) {
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return null;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
  
  // For new interface, we don't use message-bubble wrapper
  // Just set innerHTML directly on the message div
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
  const codeBlockRegex = /```(?:jsx|tsx|javascript|js)?\n([\s\S]*?)```/g;
  const codeMatches = [...text.matchAll(codeBlockRegex)];
  const code = codeMatches.length > 0 ? codeMatches[0][1].trim() : '';
  
  const summaryMatch = text.match(/## Summary\n([\s\S]*?)(?=\n##|```|$)/i);
  const explanationMatch = text.match(/## Explanation\n([\s\S]*?)(?=\n##|$)/i);
  
  return {
    code,
    summary: summaryMatch ? summaryMatch[1].trim() : '',
    explanation: explanationMatch ? explanationMatch[1].trim() : '',
    hasContent: !!(summaryMatch || explanationMatch || code)
  };
}

export function formatAIResponse(parsed, rawText) {
  if (!parsed.hasContent) {
    return rawText.replace(/\n/g, '<br>');
  }
  
  let html = '<div class="ai-response">';
  
  if (parsed.summary) {
    html += '<div class="response-section">';
    html += '<div class="section-header">Summary</div>';
    const items = parsed.summary.split('\n').filter(l => l.trim().startsWith('-'));
    if (items.length > 0) {
      html += '<ul class="summary-list">';
      items.forEach(item => {
        html += `<li>${escapeHtml(item.replace(/^-\s*/, ''))}</li>`;
      });
      html += '</ul>';
    } else {
      html += `<div class="explanation-text">${escapeHtml(parsed.summary)}</div>`;
    }
    html += '</div>';
  }
  
  if (parsed.explanation) {
    html += '<div class="response-section">';
    html += '<div class="section-header">Explanation</div>';
    html += `<div class="explanation-text">${escapeHtml(parsed.explanation).replace(/\n/g, '<br>')}</div>`;
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}
