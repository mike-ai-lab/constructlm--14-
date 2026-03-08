import React, { useState } from 'react';
import { Lightbulb, Eye, EyeOff } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiKey: string;
  cerebrasKey: string;
  groqKey: string;
  openrouterKey: string;
  onSaveKeys: (gemini: string, cerebras: string, groq: string, openrouter: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  geminiKey,
  cerebrasKey,
  groqKey,
  openrouterKey,
  onSaveKeys
}) => {
  const [localGeminiKey, setLocalGeminiKey] = useState(geminiKey);
  const [localCerebrasKey, setLocalCerebrasKey] = useState(cerebrasKey);
  const [localGroqKey, setLocalGroqKey] = useState(groqKey);
  const [localOpenRouterKey, setLocalOpenRouterKey] = useState(openrouterKey);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showCerebrasKey, setShowCerebrasKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingCerebras, setTestingCerebras] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cerebrasStatus, setCerebrasStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [geminiError, setGeminiError] = useState('');
  const [cerebrasError, setCerebrasError] = useState('');

  // Sync local state with props when they change
  React.useEffect(() => {
    setLocalGeminiKey(geminiKey);
    setLocalCerebrasKey(cerebrasKey);
    setLocalGroqKey(groqKey);
    setLocalOpenRouterKey(openrouterKey);
  }, [geminiKey, cerebrasKey, groqKey, openrouterKey]);

  if (!isOpen) return null;

  const testGeminiKey = async () => {
    if (!localGeminiKey.trim()) return;
    
    setTestingGemini(true);
    setGeminiStatus('idle');
    setGeminiError('');
    
    try {
      // Test with a simple chat request (NOT embeddings)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${localGeminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'test' }]
            }]
          })
        }
      );
      
      if (response.ok) {
        setGeminiStatus('success');
      } else {
        const error = await response.json();
        console.error('Gemini test error:', error);
        setGeminiStatus('error');
        setGeminiError(error.error?.message || 'Invalid API key');
      }
    } catch (error) {
      console.error('Gemini test error:', error);
      setGeminiStatus('error');
      setGeminiError('Network error or invalid key');
    } finally {
      setTestingGemini(false);
    }
  };

  const testCerebrasKey = async () => {
    if (!localCerebrasKey.trim()) return;
    
    setTestingCerebras(true);
    setCerebrasStatus('idle');
    setCerebrasError('');
    
    try {
      // Test with a simple chat completion request
      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localCerebrasKey}`
        },
        body: JSON.stringify({
          model: 'llama3.1-8b',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
          stream: false
        })
      });
      
      if (response.ok) {
        setCerebrasStatus('success');
      } else {
        const error = await response.json();
        console.error('Cerebras test error:', error);
        setCerebrasStatus('error');
        setCerebrasError(error.error?.message || error.message || 'Invalid API key');
      }
    } catch (error) {
      console.error('Cerebras test error:', error);
      setCerebrasStatus('error');
      setCerebrasError('Network error or invalid key');
    } finally {
      setTestingCerebras(false);
    }
  };

  const handleSave = () => {
    onSaveKeys(localGeminiKey, localCerebrasKey, localGroqKey, localOpenRouterKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1b1b1d] border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#0f0f11]">
          <h2 className="font-mono text-lg font-bold">SETTINGS</h2>
          <button 
            onClick={onClose}
            className="text-2xl font-bold hover:bg-slate-100 dark:hover:bg-[#0a0a0b] px-2 leading-none rounded transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info */}
          <div className="bg-brand-blue/10 border border-brand-blue/20 p-3 text-xs font-mono flex items-start gap-2 rounded">
            <Lightbulb size={16} className="shrink-0 mt-0.5 text-brand-blue" />
            <div>
              <strong>TIP:</strong> API keys are stored locally in your browser. They never leave your device.
            </div>
          </div>

          {/* Gemini API Key */}
          <div>
            <label className="block font-mono text-sm font-bold mb-2">
              GEMINI API KEY
            </label>
            <div className="flex gap-2 mb-2">
              <div className="flex-1 relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={localGeminiKey}
                  onChange={(e) => {
                    setLocalGeminiKey(e.target.value);
                    setGeminiStatus('idle');
                    setGeminiError('');
                  }}
                  placeholder="Enter your Gemini API key"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0b] focus:border-brand-blue outline-none font-mono text-sm rounded"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-brand-blue"
                >
                  {showGeminiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                onClick={testGeminiKey}
                disabled={!localGeminiKey.trim() || testingGemini}
                className="px-4 py-2 bg-brand-blue text-white font-mono text-xs font-bold hover:bg-brand-blue/90 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed rounded transition-colors"
              >
                {testingGemini ? 'TESTING...' : 'TEST'}
              </button>
            </div>
            {geminiStatus === 'success' && (
              <div className="text-green-600 text-xs font-mono">✓ Valid API key</div>
            )}
            {geminiStatus === 'error' && (
              <div className="text-red-600 text-xs font-mono">✗ {geminiError}</div>
            )}
            <a 
              href="https://makersuite.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs font-mono"
            >
              Get Gemini API Key →
            </a>
          </div>

          {/* Cerebras API Key */}
          <div>
            <label className="block font-mono text-sm font-bold mb-2">
              CEREBRAS API KEY
            </label>
            <div className="flex gap-2 mb-2">
              <div className="flex-1 relative">
                <input
                  type={showCerebrasKey ? 'text' : 'password'}
                  value={localCerebrasKey}
                  onChange={(e) => {
                    setLocalCerebrasKey(e.target.value);
                    setCerebrasStatus('idle');
                    setCerebrasError('');
                  }}
                  placeholder="Enter your Cerebras API key"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0b] focus:border-brand-blue outline-none font-mono text-sm rounded"
                />
                <button
                  type="button"
                  onClick={() => setShowCerebrasKey(!showCerebrasKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-brand-blue"
                >
                  {showCerebrasKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                onClick={testCerebrasKey}
                disabled={!localCerebrasKey.trim() || testingCerebras}
                className="px-4 py-2 bg-brand-blue text-white font-mono text-xs font-bold hover:bg-brand-blue/90 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed rounded transition-colors"
              >
                {testingCerebras ? 'TESTING...' : 'TEST'}
              </button>
            </div>
            {cerebrasStatus === 'success' && (
              <div className="text-green-600 text-xs font-mono">✓ Valid API key</div>
            )}
            {cerebrasStatus === 'error' && (
              <div className="text-red-600 text-xs font-mono">✗ {cerebrasError}</div>
            )}
            <a 
              href="https://cloud.cerebras.ai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs font-mono"
            >
              Get Cerebras API Key →
            </a>
          </div>

          {/* Groq API Key */}
          <div>
            <label className="block font-mono text-sm font-bold mb-2">
              GROQ API KEY
            </label>
            <div className="flex gap-2 mb-2">
              <div className="flex-1 relative">
                <input
                  type={showGroqKey ? 'text' : 'password'}
                  value={localGroqKey}
                  onChange={(e) => setLocalGroqKey(e.target.value)}
                  placeholder="Enter your Groq API key"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0b] focus:border-brand-blue outline-none font-mono text-sm rounded"
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-brand-blue"
                >
                  {showGroqKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <a 
              href="https://console.groq.com/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs font-mono"
            >
              Get Groq API Key →
            </a>
          </div>

          {/* OpenRouter API Key */}
          <div>
            <label className="block font-mono text-sm font-bold mb-2">
              OPENROUTER API KEY
            </label>
            <div className="flex gap-2 mb-2">
              <div className="flex-1 relative">
                <input
                  type={showOpenRouterKey ? 'text' : 'password'}
                  value={localOpenRouterKey}
                  onChange={(e) => setLocalOpenRouterKey(e.target.value)}
                  placeholder="Enter your OpenRouter API key"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0b] focus:border-brand-blue outline-none font-mono text-sm rounded"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-brand-blue"
                >
                  {showOpenRouterKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <a 
              href="https://openrouter.ai/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs font-mono"
            >
              Get OpenRouter API Key →
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-[#0f0f11]">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-white/10 font-mono text-sm font-bold hover:bg-slate-100 dark:hover:bg-[#0a0a0b] rounded transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-brand-blue text-white font-mono text-sm font-bold hover:bg-brand-blue/90 rounded transition-colors"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
};
