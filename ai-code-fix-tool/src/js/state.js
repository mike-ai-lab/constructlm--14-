// Application state management

// Unique namespace for this app to avoid conflicts with other apps
const APP_NAMESPACE = 'ai_code_fix_pro_v3_';

export const state = {
  originalCode: '',
  suggestedCode: '',
  errors: [],
  isProcessing: false,
  chatPanelVisible: true,
  currentAIResponse: '',
  debugLog: [],
  history: [],
  historyIndex: -1,
  lastSaveTime: 0,
  
  // Multi-provider AI configuration
  selectedProvider: 'groq', // Default provider
  selectedModel: 'llama-3.3-70b-versatile', // Default Groq model
  apiKeys: {
    groq: '',
    gemini: '',
    cerebras: '',
    openrouter: '',
    ollama: ''
  },
  ollamaBaseUrl: 'http://localhost:11434'
};

// Load API keys from server endpoint and localStorage
export async function loadAPIKeys() {
  try {
    // Load from server (.env.local)
    const response = await fetch('/api/config');
    const config = await response.json();
    
    // Load each provider's key with namespaced localStorage keys
    state.apiKeys.groq = config.GROQ_API_KEY || localStorage.getItem(APP_NAMESPACE + 'groq_api_key') || '';
    state.apiKeys.gemini = config.GEMINI_API_KEY || localStorage.getItem(APP_NAMESPACE + 'gemini_api_key') || '';
    state.apiKeys.cerebras = config.CEREBRAS_API_KEY || localStorage.getItem(APP_NAMESPACE + 'cerebras_api_key') || '';
    state.apiKeys.openrouter = config.OPENROUTER_API_KEY || localStorage.getItem(APP_NAMESPACE + 'openrouter_api_key') || '';
    state.apiKeys.ollama = config.OLLAMA_API_KEY || localStorage.getItem(APP_NAMESPACE + 'ollama_api_key') || '';
    
    // Load provider preferences with namespace
    state.selectedProvider = localStorage.getItem(APP_NAMESPACE + 'selected_provider') || 'groq';
    
    // Set default model based on provider
    const defaultModels = {
      groq: 'llama-3.3-70b-versatile',
      gemini: 'gemini-2.5-flash',
      cerebras: 'llama3.1-8b',
      openrouter: 'openai/gpt-oss-20b:free',
      ollama: 'llama3.1:8b'
    };
    
    state.selectedModel = localStorage.getItem(APP_NAMESPACE + 'selected_model') || defaultModels[state.selectedProvider];
    state.ollamaBaseUrl = localStorage.getItem(APP_NAMESPACE + 'ollama_base_url') || 'http://localhost:11434';
    
    console.log('API keys loaded:', {
      groq: !!state.apiKeys.groq,
      gemini: !!state.apiKeys.gemini,
      cerebras: !!state.apiKeys.cerebras,
      openrouter: !!state.apiKeys.openrouter,
      ollama: !!state.apiKeys.ollama
    });
    
    return state.apiKeys;
  } catch (error) {
    console.error('Failed to load API keys:', error);
    return state.apiKeys;
  }
}

// Save API keys to localStorage with namespace
export function saveAPIKeys() {
  localStorage.setItem(APP_NAMESPACE + 'groq_api_key', state.apiKeys.groq);
  localStorage.setItem(APP_NAMESPACE + 'gemini_api_key', state.apiKeys.gemini);
  localStorage.setItem(APP_NAMESPACE + 'cerebras_api_key', state.apiKeys.cerebras);
  localStorage.setItem(APP_NAMESPACE + 'openrouter_api_key', state.apiKeys.openrouter);
  localStorage.setItem(APP_NAMESPACE + 'ollama_api_key', state.apiKeys.ollama);
  localStorage.setItem(APP_NAMESPACE + 'selected_provider', state.selectedProvider);
  localStorage.setItem(APP_NAMESPACE + 'selected_model', state.selectedModel);
  localStorage.setItem(APP_NAMESPACE + 'ollama_base_url', state.ollamaBaseUrl);
  console.log('API keys saved to localStorage');
}

// Backward compatibility - keep old function name
export async function loadAPIKey() {
  await loadAPIKeys();
  return state.apiKeys.groq;
}
