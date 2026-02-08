import React, { useState } from 'react';
import { Lightbulb, Eye, EyeOff } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiKey: string;
  cerebrasKey: string;
  onSaveKeys: (gemini: string, cerebras: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  geminiKey,
  cerebrasKey,
  onSaveKeys
}) => {
  const [localGeminiKey, setLocalGeminiKey] = useState(geminiKey);
  const [localCerebrasKey, setLocalCerebrasKey] = useState(cerebrasKey);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showCerebrasKey, setShowCerebrasKey] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingCerebras, setTestingCerebras] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cerebrasStatus, setCerebrasStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [geminiError, setGeminiError] = useState('');
  const [cerebrasError, setCerebrasError] = useState('');

  if (!isOpen) return null;

  const testGeminiKey = async () => {
    if (!localGeminiKey.trim()) return;
    
    setTestingGemini(true);
    setGeminiStatus('idle');
    setGeminiError('');
    
    try {
      // Test with a simple embedding request
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${localGeminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: {
              parts: [{ text: 'test' }]
            }
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
    onSaveKeys(localGeminiKey, localCerebrasKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b-2 border-black flex justify-between items-center bg-gray-50">
          <h2 className="font-mono text-lg font-bold">SETTINGS</h2>
          <button 
            onClick={onClose}
            className="text-2xl font-bold hover:bg-gray-200 px-2 leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info */}
          <div className="bg-gray-100 border border-gray-300 p-3 text-xs font-mono flex items-start gap-2">
            <Lightbulb size={16} className="shrink-0 mt-0.5" />
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
                  className="w-full px-3 py-2 border border-gray-300 focus:border-black outline-none font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                >
                  {showGeminiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                onClick={testGeminiKey}
                disabled={!localGeminiKey.trim() || testingGemini}
                className="px-4 py-2 bg-black text-white font-mono text-xs font-bold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
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
                  className="w-full px-3 py-2 border border-gray-300 focus:border-black outline-none font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowCerebrasKey(!showCerebrasKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                >
                  {showCerebrasKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                onClick={testCerebrasKey}
                disabled={!localCerebrasKey.trim() || testingCerebras}
                className="px-4 py-2 bg-black text-white font-mono text-xs font-bold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
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
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-black flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 font-mono text-sm font-bold hover:bg-gray-100"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-black text-white font-mono text-sm font-bold hover:bg-gray-800"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
};
