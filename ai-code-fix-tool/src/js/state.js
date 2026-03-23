// Application state management

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
  apiKey: ''
};

// Load API key from server endpoint
export async function loadAPIKey() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    const key = config.GROQ_API_KEY;
    
    if (!key) {
      console.warn('No API key found in .env.local');
      console.warn('Please add VITE_GROQ_API_KEY to ai-code-fix-tool/.env.local');
      return '';
    }
    
    state.apiKey = key;
    console.log('API key loaded from .env.local successfully');
    return key;
  } catch (error) {
    console.error('Failed to load API key:', error);
    return '';
  }
}
