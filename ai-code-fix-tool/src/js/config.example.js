// API Configuration Template
// Copy this file to config.js and add your actual API keys

export const API_KEYS = {
  GROQ: 'your-groq-api-key-here',
  GEMINI: 'your-gemini-api-key-here',
  CEREBRAS: 'your-cerebras-api-key-here',
  OPENROUTER: 'your-openrouter-api-key-here',
  OLLAMA: 'your-ollama-api-key-here'
};

// Get the Groq API key (primary key for this tool)
export function getGroqAPIKey() {
  // Priority: 1. Config file, 2. localStorage, 3. prompt user
  if (API_KEYS.GROQ && API_KEYS.GROQ !== 'your-groq-api-key-here') {
    return API_KEYS.GROQ;
  }
  
  const stored = localStorage.getItem('groq_api_key');
  if (stored) {
    return stored;
  }
  
  return null;
}
