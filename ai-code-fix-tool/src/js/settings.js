// Settings modal for AI provider configuration
import { state, saveAPIKeys } from './state.js';

let settingsModal = null;

export function openSettings() {
  if (!settingsModal) {
    createSettingsModal();
  }
  settingsModal.style.display = 'flex';
  
  // Load current values
  document.getElementById('groq-api-key').value = state.apiKeys.groq;
  document.getElementById('gemini-api-key').value = state.apiKeys.gemini;
  document.getElementById('cerebras-api-key').value = state.apiKeys.cerebras;
  document.getElementById('openrouter-api-key').value = state.apiKeys.openrouter;
  document.getElementById('ollama-api-key').value = state.apiKeys.ollama;
  document.getElementById('ollama-base-url').value = state.ollamaBaseUrl;
}

export function closeSettings() {
  if (settingsModal) {
    settingsModal.style.display = 'none';
  }
}

function createSettingsModal() {
  settingsModal = document.createElement('div');
  settingsModal.id = 'settings-modal';
  settingsModal.innerHTML = `
    <div class="settings-overlay"></div>
    <div class="settings-content">
      <div class="settings-header">
        <div class="settings-header-content">
          <h2 class="settings-title">Settings</h2>
        </div>
        <button class="settings-close" id="settings-close-btn" aria-label="Close settings">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 5L5 15M5 5l10 10"/>
          </svg>
        </button>
      </div>
      
      <form autocomplete="off" onsubmit="return false;">
      <div class="settings-body">
        <!-- Info Banner -->
        <div class="settings-info-banner">
          API keys are stored locally in your browser and never leave your device.
        </div>
        
        <!-- Batch Operations - Compact -->
        <div class="batch-operations-compact">
          <button type="button" class="batch-btn" id="import-keys-btn" title="Import API keys from JSON file">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Import
          </button>
          <button type="button" class="batch-btn" id="export-keys-btn" title="Export API keys to JSON file">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Export
          </button>
          <button type="button" class="batch-btn" id="test-all-keys-btn" title="Test all API keys at once">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Test All
          </button>
        </div>
        <input type="file" id="import-file-input" accept=".json" style="display: none;" />
        
        <!-- API Keys Section -->
        <div class="settings-group">
          
          <div class="settings-section api-key-field">
            <label class="settings-label">
              <span class="label-text">Groq API Key</span>
              <a href="https://console.groq.com/keys" target="_blank" class="settings-link">GET KEY →</a>
            </label>
            <div class="input-row">
              <div class="input-group">
                <input type="password" id="groq-api-key" class="settings-input" placeholder="gsk_..." autocomplete="off" data-form-type="other" />
                <button type="button" class="input-toggle" onclick="togglePasswordVisibility('groq-api-key')">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              <button type="button" class="test-api-btn" id="test-groq-btn" onclick="testAPIKey('groq')">TEST</button>
            </div>
            <div class="test-status" id="groq-test-status"></div>
          </div>

          <div class="settings-section api-key-field">
            <label class="settings-label">
              <span class="label-text">Gemini API Key</span>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" class="settings-link">GET KEY →</a>
            </label>
            <div class="input-row">
              <div class="input-group">
                <input type="password" id="gemini-api-key" class="settings-input" placeholder="AIza..." autocomplete="off" data-form-type="other" />
                <button type="button" class="input-toggle" onclick="togglePasswordVisibility('gemini-api-key')">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              <button type="button" class="test-api-btn" id="test-gemini-btn" onclick="testAPIKey('gemini')">TEST</button>
            </div>
            <div class="test-status" id="gemini-test-status"></div>
          </div>

          <div class="settings-section api-key-field">
            <label class="settings-label">
              <span class="label-text">Cerebras API Key</span>
              <a href="https://cloud.cerebras.ai/" target="_blank" class="settings-link">GET KEY →</a>
            </label>
            <div class="input-row">
              <div class="input-group">
                <input type="password" id="cerebras-api-key" class="settings-input" placeholder="csk_..." autocomplete="off" data-form-type="other" />
                <button type="button" class="input-toggle" onclick="togglePasswordVisibility('cerebras-api-key')">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              <button type="button" class="test-api-btn" id="test-cerebras-btn" onclick="testAPIKey('cerebras')">TEST</button>
            </div>
            <div class="test-status" id="cerebras-test-status"></div>
          </div>

          <div class="settings-section api-key-field">
            <label class="settings-label">
              <span class="label-text">OpenRouter API Key</span>
              <a href="https://openrouter.ai/keys" target="_blank" class="settings-link">GET KEY →</a>
            </label>
            <div class="input-row">
              <div class="input-group">
                <input type="password" id="openrouter-api-key" class="settings-input" placeholder="sk-or-..." autocomplete="off" data-form-type="other" />
                <button type="button" class="input-toggle" onclick="togglePasswordVisibility('openrouter-api-key')">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              <button type="button" class="test-api-btn" id="test-openrouter-btn" onclick="testAPIKey('openrouter')">TEST</button>
            </div>
            <div class="test-status" id="openrouter-test-status"></div>
          </div>

          <div class="settings-section api-key-field">
            <label class="settings-label">
              <span class="label-text">Ollama Configuration</span>
              <a href="https://ollama.ai" target="_blank" class="settings-link">INSTALL →</a>
            </label>
            <div class="input-row">
              <div class="input-group">
                <input type="text" id="ollama-base-url" class="settings-input" placeholder="http://localhost:11434" autocomplete="off" data-form-type="other" />
              </div>
              <button type="button" class="test-api-btn" id="test-ollama-btn" onclick="testAPIKey('ollama')">TEST</button>
            </div>
            <div class="test-status" id="ollama-test-status"></div>
          </div>
          
          <!-- Hidden Ollama API Key field for compatibility -->
          <input type="hidden" id="ollama-api-key" value="" />
        </div>
      </div>
      </form>

      <div class="settings-footer">
        <button class="settings-btn settings-btn-secondary" id="settings-cancel-btn">CANCEL</button>
        <button class="settings-btn settings-btn-primary" id="settings-save-btn">SAVE</button>
      </div>
    </div>
  `;

  document.body.appendChild(settingsModal);

  // Event listeners
  document.getElementById('settings-close-btn').addEventListener('click', closeSettings);
  document.getElementById('settings-cancel-btn').addEventListener('click', closeSettings);
  document.getElementById('settings-save-btn').addEventListener('click', saveSettings);
  settingsModal.querySelector('.settings-overlay').addEventListener('click', closeSettings);

  // Batch operations
  document.getElementById('import-keys-btn').addEventListener('click', importKeys);
  document.getElementById('export-keys-btn').addEventListener('click', exportKeys);
  document.getElementById('test-all-keys-btn').addEventListener('click', testAllKeys);
  document.getElementById('import-file-input').addEventListener('change', handleFileImport);

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Toggle password visibility
window.togglePasswordVisibility = function(inputId) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
};

// Test API key function
window.testAPIKey = async function(provider) {
  const statusSpan = document.getElementById(`${provider}-test-status`);
  const testBtn = document.getElementById(`test-${provider}-btn`);
  const apiKeyInput = document.getElementById(`${provider}-api-key`);
  
  const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
  
  if (!apiKey && provider !== 'ollama') {
    statusSpan.innerHTML = '<span style="color: #ef4444;">✗ Enter API key first</span>';
    statusSpan.className = 'test-status error';
    return;
  }
  
  testBtn.disabled = true;
  statusSpan.innerHTML = '<span style="color: #60a5fa;">Testing...</span>';
  statusSpan.className = 'test-status';
  
  try {
    let isValid = false;
    
    switch(provider) {
      case 'groq':
        const groqResponse = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        isValid = groqResponse.ok;
        break;
        
      case 'gemini':
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
        );
        isValid = geminiResponse.ok;
        break;
        
      case 'cerebras':
        const cerebrasResponse = await fetch('https://api.cerebras.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        isValid = cerebrasResponse.ok;
        break;
        
      case 'openrouter':
        const openrouterResponse = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        isValid = openrouterResponse.ok;
        break;
        
      case 'ollama':
        const baseUrl = document.getElementById('ollama-base-url').value.trim() || 'http://localhost:11434';
        const ollamaResponse = await fetch(`${baseUrl}/api/tags`);
        isValid = ollamaResponse.ok;
        break;
    }
    
    if (isValid) {
      statusSpan.innerHTML = '<span style="color: #10b981;">✓ Valid</span>';
      statusSpan.className = 'test-status success';
    } else {
      statusSpan.innerHTML = '<span style="color: #ef4444;">✗ Invalid API key</span>';
      statusSpan.className = 'test-status error';
    }
  } catch (error) {
    statusSpan.innerHTML = '<span style="color: #ef4444;">✗ Connection failed</span>';
    statusSpan.className = 'test-status error';
  }
  
  testBtn.disabled = false;
};

function saveSettings() {
  // Save API keys
  state.apiKeys.groq = document.getElementById('groq-api-key').value.trim();
  state.apiKeys.gemini = document.getElementById('gemini-api-key').value.trim();
  state.apiKeys.cerebras = document.getElementById('cerebras-api-key').value.trim();
  state.apiKeys.openrouter = document.getElementById('openrouter-api-key').value.trim();
  state.apiKeys.ollama = document.getElementById('ollama-api-key').value.trim();
  state.ollamaBaseUrl = document.getElementById('ollama-base-url').value.trim() || 'http://localhost:11434';

  // Persist to localStorage
  saveAPIKeys();

  // Update UI
  updateProviderBadge();

  closeSettings();
  
  // Show success message
  const statusBadge = document.getElementById('status-badge');
  statusBadge.textContent = 'Settings Saved';
  statusBadge.className = 'status-badge success';
  setTimeout(() => {
    updateProviderBadge();
  }, 2000);
}

function updateProviderBadge() {
  const providerBadge = document.getElementById('provider-badge');
  if (providerBadge) {
    const providerNames = {
      groq: 'Groq',
      gemini: 'Gemini',
      cerebras: 'Cerebras',
      openrouter: 'OpenRouter',
      ollama: 'Ollama'
    };
    
    const providerName = providerNames[state.selectedProvider] || state.selectedProvider;
    const modelId = state.selectedModel || 'No model';
    
    // Modern structure for premium header
    providerBadge.innerHTML = `
      <span class="provider-label">${providerName}</span>
      <span class="provider-separator">|</span>
      <span class="model-id-label">${modelId}</span>
      <i data-lucide="chevron-down" class="w-3 h-3 ml-1.5 opacity-40"></i>
    `;
    providerBadge.title = `Click to change model\nProvider: ${providerName}\nModel: ${modelId}`;
    
    // Re-initialize icons if lucide is available
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}

// Initialize provider badge on load
export function initializeProviderBadge() {
  updateProviderBadge();
}


// Export API keys to JSON file
function exportKeys() {
  const exportData = {
    version: "1.0",
    app: "AI Code Fix Pro V3",
    description: "API Keys Configuration - Keep this file secure and never commit to version control",
    exportDate: new Date().toISOString(),
    keys: {
      groq: state.apiKeys.groq,
      gemini: state.apiKeys.gemini,
      cerebras: state.apiKeys.cerebras,
      openrouter: state.apiKeys.openrouter,
      ollama: state.apiKeys.ollama
    },
    settings: {
      ollamaBaseUrl: state.ollamaBaseUrl,
      selectedProvider: state.selectedProvider,
      selectedModel: state.selectedModel
    }
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-code-fix-pro-keys-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showBatchMessage('API keys exported successfully', 'success');
}

// Trigger file import
function importKeys() {
  const fileInput = document.getElementById('import-file-input');
  fileInput.click();
}

// Handle file import
async function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate JSON structure
    if (!data.keys || typeof data.keys !== 'object') {
      throw new Error('Invalid JSON format. Expected "keys" object.');
    }

    // Security check: Validate key formats
    const keyValidations = {
      groq: /^gsk_[a-zA-Z0-9_-]+$/,
      gemini: /^AIza[a-zA-Z0-9_-]+$/,
      cerebras: /^csk-[a-zA-Z0-9]+$/,
      openrouter: /^sk-or-v1-[a-f0-9]+$/,
      ollama: /^[a-zA-Z0-9._-]+$/ // More flexible for Ollama
    };

    let importedCount = 0;
    const warnings = [];

    // Import keys with validation
    for (const [provider, key] of Object.entries(data.keys)) {
      if (key && key.trim()) {
        const trimmedKey = key.trim();
        
        // Validate format if pattern exists
        if (keyValidations[provider] && !keyValidations[provider].test(trimmedKey)) {
          warnings.push(`${provider}: Invalid key format (skipped)`);
          continue;
        }

        // Update input field
        const input = document.getElementById(`${provider}-api-key`);
        if (input) {
          input.value = trimmedKey;
          importedCount++;
        }
      }
    }

    // Import settings if available
    if (data.settings) {
      if (data.settings.ollamaBaseUrl) {
        document.getElementById('ollama-base-url').value = data.settings.ollamaBaseUrl;
      }
    }

    // Show results
    let message = `Imported ${importedCount} API key(s)`;
    if (warnings.length > 0) {
      message += `\n⚠️ ${warnings.join(', ')}`;
    }
    showBatchMessage(message, warnings.length > 0 ? 'warning' : 'success');

    // Clear file input
    event.target.value = '';

  } catch (error) {
    showBatchMessage(`Import failed: ${error.message}`, 'error');
    event.target.value = '';
  }
}

// Test all API keys at once
async function testAllKeys() {
  const testBtn = document.getElementById('test-all-keys-btn');
  
  testBtn.disabled = true;
  testBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
    </svg>
    Testing...
  `;

  const providers = ['groq', 'gemini', 'cerebras', 'openrouter', 'ollama'];
  const results = [];

  for (const provider of providers) {
    const input = document.getElementById(`${provider}-api-key`);
    const statusSpan = document.getElementById(`${provider}-test-status`);
    const apiKey = input ? input.value.trim() : '';

    if (!apiKey && provider !== 'ollama') {
      results.push({ provider, status: 'skipped', message: 'No key' });
      if (statusSpan) {
        statusSpan.innerHTML = '<span style="color: #6b7280;">○ Skipped</span>';
      }
      continue;
    }

    if (statusSpan) {
      statusSpan.innerHTML = '<span style="color: #60a5fa;">Testing...</span>';
    }

    try {
      let isValid = false;

      switch(provider) {
        case 'groq':
          const groqResponse = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          isValid = groqResponse.ok;
          break;

        case 'gemini':
          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
          );
          isValid = geminiResponse.ok;
          break;

        case 'cerebras':
          const cerebrasResponse = await fetch('https://api.cerebras.ai/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          isValid = cerebrasResponse.ok;
          break;

        case 'openrouter':
          const openrouterResponse = await fetch('https://openrouter.ai/api/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          isValid = openrouterResponse.ok;
          break;

        case 'ollama':
          const baseUrl = document.getElementById('ollama-base-url').value.trim() || 'http://localhost:11434';
          const ollamaResponse = await fetch(`${baseUrl}/api/tags`);
          isValid = ollamaResponse.ok;
          break;
      }

      results.push({
        provider,
        status: isValid ? 'valid' : 'invalid',
        message: isValid ? 'Valid' : 'Invalid'
      });

      if (statusSpan) {
        if (isValid) {
          statusSpan.innerHTML = '<span style="color: #10b981;">✓ Valid</span>';
          statusSpan.className = 'test-status success';
        } else {
          statusSpan.innerHTML = '<span style="color: #ef4444;">✗ Invalid</span>';
          statusSpan.className = 'test-status error';
        }
      }

    } catch (error) {
      results.push({
        provider,
        status: 'error',
        message: 'Failed'
      });
      
      if (statusSpan) {
        statusSpan.innerHTML = '<span style="color: #ef4444;">✗ Failed</span>';
        statusSpan.className = 'test-status error';
      }
    }
  }
  
  testBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    Test All
  `;
  testBtn.disabled = false;

  // Show summary
  const validCount = results.filter(r => r.status === 'valid').length;
  const totalTested = results.filter(r => r.status !== 'skipped').length;
  showBatchMessage(`Tested ${totalTested} key(s): ${validCount} valid`, validCount === totalTested ? 'success' : 'warning');
}

// Show batch operation message
function showBatchMessage(message, type = 'info') {
  const statusBadge = document.getElementById('status-badge');
  if (statusBadge) {
    statusBadge.textContent = message.split('\n')[0];
    statusBadge.className = `status-badge ${type === 'warning' ? 'processing' : type}`;
    setTimeout(() => {
      statusBadge.textContent = 'Ready';
      statusBadge.className = 'status-badge success';
    }, 3000);
  }
}
