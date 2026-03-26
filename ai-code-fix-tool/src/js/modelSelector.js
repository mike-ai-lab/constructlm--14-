// Model selector dropdown for header
import { state, saveAPIKeys } from './state.js';
import * as GroqService from './services/groqService.js';
import * as GeminiService from './services/geminiService.js';
import * as CerebrasService from './services/cerebrasService.js';
import * as OpenRouterService from './services/openrouterService.js';
import * as OllamaService from './services/ollamaService.js';

let modelDropdown = null;

export function initializeModelSelector() {
  const providerBadge = document.getElementById('provider-badge-container');
  if (!providerBadge) return;
  
  // Make pill clickable
  providerBadge.style.cursor = 'pointer';
  providerBadge.addEventListener('click', toggleModelDropdown);
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (modelDropdown && !providerBadge.contains(e.target) && !modelDropdown.contains(e.target)) {
      closeModelDropdown();
    }
  });
}

function toggleModelDropdown() {
  if (modelDropdown && modelDropdown.style.display === 'block') {
    closeModelDropdown();
  } else {
    openModelDropdown();
  }
}

function openModelDropdown() {
  if (!modelDropdown) {
    createModelDropdown();
  }
  
  // Position dropdown
  const pill = document.getElementById('provider-badge-container');
  const rect = pill.getBoundingClientRect();
  
  modelDropdown.style.top = `${rect.bottom + 8}px`;
  modelDropdown.style.left = `${rect.left}px`;
  modelDropdown.style.display = 'block';
  
  // Populate with current models
  populateModelDropdown();
}

function closeModelDropdown() {
  if (modelDropdown) {
    modelDropdown.style.display = 'none';
  }
}

function createModelDropdown() {
  modelDropdown = document.createElement('div');
  modelDropdown.id = 'model-dropdown';
  modelDropdown.className = 'model-dropdown';
  document.body.appendChild(modelDropdown);
}

function populateModelDropdown() {
  const providers = [
    { id: 'groq', name: 'Groq', models: GroqService.GROQ_MODELS },
    { id: 'gemini', name: 'Gemini', models: GeminiService.GEMINI_MODELS },
    { id: 'cerebras', name: 'Cerebras', models: CerebrasService.CEREBRAS_MODELS },
    { id: 'openrouter', name: 'OpenRouter', models: OpenRouterService.OPENROUTER_MODELS },
    { id: 'ollama', name: 'Ollama Local', models: OllamaService.OLLAMA_LOCAL_MODELS },
    { id: 'ollama-cloud', name: 'Ollama Cloud', models: OllamaService.OLLAMA_CLOUD_MODELS }
  ];
  
  let html = '<div class="model-dropdown-header">Select AI Model</div>';
  
  providers.forEach(provider => {
    const isActive = state.selectedProvider === provider.id || 
                     (provider.id === 'ollama-cloud' && state.selectedProvider === 'ollama');
    
    html += `
      <div class="model-provider-section ${isActive ? 'active' : ''}">
        <div class="model-provider-header" onclick="toggleProviderSection('${provider.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span>${provider.name}</span>
          <span class="model-count">${provider.models.length}</span>
        </div>
        <div class="model-provider-models" id="models-${provider.id}">
    `;
    
    provider.models.forEach(model => {
      const isSelected = state.selectedProvider === provider.id && state.selectedModel === model.id;
      const visionBadge = model.vision ? '<span class="mini-badge vision">Vision</span>' : '';
      const tags = model.tags ? model.tags.slice(0, 2).map(tag => 
        `<span class="mini-badge ${tag.toLowerCase()}">${tag}</span>`
      ).join('') : '';
      
      html += `
        <div class="model-option ${isSelected ? 'selected' : ''}" onclick="selectModel('${provider.id}', '${model.id}')">
          <div class="model-option-name">${model.name}</div>
          <div class="model-option-meta">
            <span class="model-option-context">${model.context}</span>
            ${visionBadge}
            ${tags}
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  });
  
  modelDropdown.innerHTML = html;
}

// Toggle provider section
window.toggleProviderSection = function(providerId) {
  const section = document.getElementById(`models-${providerId}`);
  const header = section.previousElementSibling;
  
  if (section.style.display === 'none' || !section.style.display) {
    section.style.display = 'block';
    header.classList.add('expanded');
  } else {
    section.style.display = 'none';
    header.classList.remove('expanded');
  }
};

// Select model
window.selectModel = function(providerId, modelId) {
  // Handle ollama-cloud as ollama provider
  const actualProvider = providerId === 'ollama-cloud' ? 'ollama' : providerId;
  
  state.selectedProvider = actualProvider;
  state.selectedModel = modelId;
  
  // Save to localStorage
  saveAPIKeys();
  
  // Update UI
  updateProviderBadge();
  
  // Close dropdown
  closeModelDropdown();
  
  // Show confirmation
  const statusBadge = document.getElementById('status-badge');
  statusBadge.textContent = 'Model Changed';
  statusBadge.className = 'status-badge success';
  setTimeout(() => {
    statusBadge.textContent = 'Ready';
    statusBadge.className = 'status-badge success';
  }, 1500);
};

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

export function updateModelBadge() {
  updateProviderBadge();
}
