import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiKey: string;
  cerebrasKey: string;
  groqKey: string;
  openrouterKey: string;
  ollamaKey: string;
  ollamaBaseUrl: string;
  ollamaMode: 'local' | 'cloud';
  onSaveKeys: (gemini: string, cerebras: string, groq: string, openrouter: string, ollama: string, ollamaUrl: string, ollamaMode: 'local' | 'cloud') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  geminiKey,
  cerebrasKey,
  groqKey,
  openrouterKey,
  ollamaKey,
  ollamaBaseUrl,
  ollamaMode: initialOllamaMode,
  onSaveKeys
}) => {
  const [localGeminiKey, setLocalGeminiKey] = useState(geminiKey);
  const [localCerebrasKey, setLocalCerebrasKey] = useState(cerebrasKey);
  const [localGroqKey, setLocalGroqKey] = useState(groqKey);
  const [localOpenRouterKey, setLocalOpenRouterKey] = useState(openrouterKey);
  const [localOllamaKey, setLocalOllamaKey] = useState(ollamaKey);
  const [localOllamaBaseUrl, setLocalOllamaBaseUrl] = useState(ollamaBaseUrl);
  const [localOllamaMode, setLocalOllamaMode] = useState<'local' | 'cloud'>(initialOllamaMode);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showCerebrasKey, setShowCerebrasKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [showOllamaKey, setShowOllamaKey] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingCerebras, setTestingCerebras] = useState(false);
  const [testingGroq, setTestingGroq] = useState(false);
  const [testingOpenRouter, setTestingOpenRouter] = useState(false);
  const [testingOllama, setTestingOllama] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cerebrasStatus, setCerebrasStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [groqStatus, setGroqStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [openrouterStatus, setOpenrouterStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [geminiError, setGeminiError] = useState('');
  const [cerebrasError, setCerebrasError] = useState('');
  const [groqError, setGroqError] = useState('');
  const [openrouterError, setOpenrouterError] = useState('');
  const [ollamaError, setOllamaError] = useState('');

  React.useEffect(() => {
    setLocalGeminiKey(geminiKey);
    setLocalCerebrasKey(cerebrasKey);
    setLocalGroqKey(groqKey);
    setLocalOpenRouterKey(openrouterKey);
    setLocalOllamaKey(ollamaKey);
    setLocalOllamaBaseUrl(ollamaBaseUrl);
  }, [geminiKey, cerebrasKey, groqKey, openrouterKey, ollamaKey, ollamaBaseUrl]);

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
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${localGeminiKey}`,
        { method: 'GET' }
      );
      if (response.ok) {
        setGeminiStatus('success');
      } else if (response.status === 401 || response.status === 403) {
        setGeminiStatus('error');
        setGeminiError('Invalid API key');
      } else {
        setGeminiStatus('error');
        setGeminiError('API error');
      }
    } catch (error) {
      setGeminiStatus('error');
      setGeminiError('Network error');
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
      const response = await fetch('https://api.cerebras.ai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localCerebrasKey}`
        }
      });
      if (response.ok) {
        setCerebrasStatus('success');
      } else if (response.status === 401 || response.status === 403) {
        setCerebrasStatus('error');
        setCerebrasError('Invalid API key');
      } else {
        setCerebrasStatus('error');
        setCerebrasError('API error');
      }
    } catch (error) {
      setCerebrasStatus('error');
      setCerebrasError('Network error');
    } finally {
      setTestingCerebras(false);
    }
  };

  const testGroqKey = async () => {
    if (!localGroqKey.trim()) return;
    setTestingGroq(true);
    setGroqStatus('idle');
    setGroqError('');
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localGroqKey}`
        }
      });
      if (response.ok) {
        setGroqStatus('success');
      } else if (response.status === 401 || response.status === 403) {
        setGroqStatus('error');
        setGroqError('Invalid API key');
      } else {
        setGroqStatus('error');
        setGroqError('API error');
      }
    } catch (error) {
      setGroqStatus('error');
      setGroqError('Network error');
    } finally {
      setTestingGroq(false);
    }
  };

  const testOpenRouterKey = async () => {
    if (!localOpenRouterKey.trim()) return;
    setTestingOpenRouter(true);
    setOpenrouterStatus('idle');
    setOpenrouterError('');
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localOpenRouterKey}`
        }
      });
      if (response.ok) {
        setOpenrouterStatus('success');
      } else if (response.status === 401 || response.status === 403) {
        setOpenrouterStatus('error');
        setOpenrouterError('Invalid API key');
      } else {
        setOpenrouterStatus('error');
        setOpenrouterError('API error');
      }
    } catch (error) {
      setOpenrouterStatus('error');
      setOpenrouterError('Network error');
    } finally {
      setTestingOpenRouter(false);
    }
  };

  const testOllamaConnection = async () => {
    setTestingOllama(true);
    setOllamaStatus('idle');
    setOllamaError('');
    try {
      // Only test local connections from browser (cloud has CORS restrictions)
      if (localOllamaMode === 'local') {
        const url = `${localOllamaBaseUrl}/api/tags`;
        const response = await fetch(url);
        if (response.ok) {
          setOllamaStatus('success');
        } else {
          setOllamaStatus('error');
          setOllamaError('Connection failed');
        }
      } else {
        // For cloud, just validate that API key is provided
        if (localOllamaKey.trim()) {
          setOllamaStatus('success');
        } else {
          setOllamaStatus('error');
          setOllamaError('API key required');
        }
      }
    } catch (error) {
      setOllamaStatus('error');
      setOllamaError(localOllamaMode === 'local' ? 'Cannot reach local Ollama' : 'Network error');
    } finally {
      setTestingOllama(false);
    }
  };

  const handleSave = () => {
    onSaveKeys(localGeminiKey, localCerebrasKey, localGroqKey, localOpenRouterKey, localOllamaKey, localOllamaBaseUrl, localOllamaMode);
    onClose();
  };

  const ApiKeyField = ({ 
    label, 
    value, 
    onChange, 
    show, 
    onToggleShow, 
    onTest, 
    testing, 
    status, 
    error, 
    link,
    placeholder
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggleShow: () => void;
    onTest: () => void;
    testing: boolean;
    status: 'idle' | 'success' | 'error';
    error: string;
    link: string;
    placeholder: string;
  }) => {
    const getKeyPreview = (key: string) => {
      if (!key) return '';
      const parts = key.split('_');
      if (parts.length > 1) {
        return `${parts[0]}_${parts[1].substring(0, 2)}...`;
      }
      return `${key.substring(0, 8)}...`;
    };

    return (
      <div className="border border-slate-200 dark:border-white/10 rounded-lg p-3 bg-white dark:bg-[#0f0f11] h-[100px] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <label className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {label}
          </label>
          <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-sans text-brand-blue hover:underline"
          >
            GET KEY →
          </a>
        </div>
        
        <div className="flex gap-2 mb-2 flex-1 flex items-center">
          <div className="flex-1 relative flex items-center">
            <input
              type={show ? 'text' : 'password'}
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              placeholder=""
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="w-full px-3 py-2 md:py-1.5 pr-8 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f0f11] focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 outline-none font-sans text-sm md:text-xs rounded transition-all touch-manipulation"
              style={{ fontSize: '16px' }}
            />
            {!value && (
              <div className="absolute left-3 text-slate-500 dark:text-slate-400 text-xs italic font-sans pointer-events-none">
                {placeholder}
              </div>
            )}
            <button
              type="button"
              onClick={onToggleShow}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-brand-blue transition-colors"
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button
            onClick={onTest}
            disabled={!value.trim() || testing}
            className="px-3 md:px-2.5 py-2 md:py-1.5 bg-brand-blue text-white font-sans text-sm md:text-xs font-semibold hover:bg-brand-blue/90 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed rounded transition-colors whitespace-nowrap min-h-[44px] md:min-h-0 touch-manipulation"
          >
            {testing ? '...' : 'TEST'}
          </button>
        </div>

        <div className="h-4">
          {status === 'success' && (
            <div className="text-green-600 dark:text-green-500 text-xs font-sans">✓ Valid</div>
          )}
          {status === 'error' && (
            <div className="text-red-600 dark:text-red-500 text-xs font-sans">✗ {error}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 md:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#0f0f11] border-t md:border border-slate-200 dark:border-white/10 w-full max-w-sm max-h-[90vh] md:max-h-[85vh] overflow-y-auto md:rounded-lg rounded-t-2xl shadow-2xl"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-[#0f0f11] z-10">
          <h2 className="font-sans text-base font-bold uppercase tracking-wider">Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-[#1b1b1d] rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3">
          <div className="text-xs font-sans text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#0f0f11] hover:bg-[#1b1b1d] p-2.5 rounded border border-slate-200 dark:border-white/10 transition-colors">
            API keys are stored locally in your browser and never leave your device.
          </div>

          <ApiKeyField
            label="Gemini API Key"
            value={localGeminiKey}
            onChange={(v) => {
              setLocalGeminiKey(v);
              setGeminiStatus('idle');
            }}
            show={showGeminiKey}
            onToggleShow={() => setShowGeminiKey(!showGeminiKey)}
            onTest={testGeminiKey}
            testing={testingGemini}
            status={geminiStatus}
            error={geminiError}
            link="https://makersuite.google.com/app/apikey"
            placeholder="AIza..."
          />

          <ApiKeyField
            label="Cerebras API Key"
            value={localCerebrasKey}
            onChange={(v) => {
              setLocalCerebrasKey(v);
              setCerebrasStatus('idle');
            }}
            show={showCerebrasKey}
            onToggleShow={() => setShowCerebrasKey(!showCerebrasKey)}
            onTest={testCerebrasKey}
            testing={testingCerebras}
            status={cerebrasStatus}
            error={cerebrasError}
            link="https://cloud.cerebras.ai/"
            placeholder="csk-..."
          />

          <ApiKeyField
            label="Groq API Key"
            value={localGroqKey}
            onChange={(v) => {
              setLocalGroqKey(v);
              setGroqStatus('idle');
            }}
            show={showGroqKey}
            onToggleShow={() => setShowGroqKey(!showGroqKey)}
            onTest={testGroqKey}
            testing={testingGroq}
            status={groqStatus}
            error={groqError}
            link="https://console.groq.com/keys"
            placeholder="gsk_..."
          />

          <ApiKeyField
            label="OpenRouter API Key"
            value={localOpenRouterKey}
            onChange={(v) => {
              setLocalOpenRouterKey(v);
              setOpenrouterStatus('idle');
            }}
            show={showOpenRouterKey}
            onToggleShow={() => setShowOpenRouterKey(!showOpenRouterKey)}
            onTest={testOpenRouterKey}
            testing={testingOpenRouter}
            status={openrouterStatus}
            error={openrouterError}
            link="https://openrouter.ai/keys"
            placeholder="sk-or-..."
          />

          {/* Ollama Configuration */}
          <div className="border border-slate-200 dark:border-white/10 rounded-lg p-3 bg-white dark:bg-[#0f0f11]">
            <div className="flex items-center justify-between mb-3">
              <label className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Ollama Configuration
              </label>
              <a 
                href="https://ollama.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-sans text-brand-blue hover:underline"
              >
                INSTALL →
              </a>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => {
                  setLocalOllamaMode('local');
                  setOllamaStatus('idle');
                }}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded transition-colors ${
                  localOllamaMode === 'local'
                    ? 'bg-brand-blue text-white'
                    : 'border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#1b1b1d]'
                }`}
              >
                LOCAL
              </button>
              <button
                onClick={() => {
                  setLocalOllamaMode('cloud');
                  setOllamaStatus('idle');
                }}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded transition-colors ${
                  localOllamaMode === 'cloud'
                    ? 'bg-brand-blue text-white'
                    : 'border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#1b1b1d]'
                }`}
              >
                CLOUD
              </button>
            </div>

            {/* Local Configuration */}
            {localOllamaMode === 'local' && (
              <div className="space-y-2 mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={localOllamaBaseUrl}
                    onChange={(e) => {
                      setLocalOllamaBaseUrl(e.target.value);
                      setOllamaStatus('idle');
                    }}
                    placeholder="http://localhost:11434"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    className="flex-1 px-3 py-2 md:py-1.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f0f11] focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 outline-none font-sans text-sm md:text-xs rounded transition-all touch-manipulation"
                    style={{ fontSize: '16px' }}
                  />
                  <button
                    onClick={testOllamaConnection}
                    disabled={testingOllama}
                    className="px-2.5 py-1.5 bg-brand-blue text-white font-sans text-xs font-semibold hover:bg-brand-blue/90 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed rounded transition-colors whitespace-nowrap"
                  >
                    {testingOllama ? '...' : 'TEST'}
                  </button>
                </div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400">
                  Default: http://localhost:11434
                </div>
              </div>
            )}

            {/* Cloud Configuration */}
            {localOllamaMode === 'cloud' && (
              <div className="space-y-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative flex items-center">
                    <input
                      type={showOllamaKey ? 'text' : 'password'}
                      value={localOllamaKey}
                      onChange={(e) => {
                        setLocalOllamaKey(e.target.value);
                        setOllamaStatus('idle');
                      }}
                      placeholder="API Key"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      className="w-full px-3 py-2 md:py-1.5 pr-8 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f0f11] focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 outline-none font-sans text-sm md:text-xs rounded transition-all touch-manipulation"
                      style={{ fontSize: '16px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOllamaKey(!showOllamaKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-brand-blue transition-colors"
                    >
                      {showOllamaKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    onClick={testOllamaConnection}
                    disabled={testingOllama}
                    className="px-2.5 py-1.5 bg-brand-blue text-white font-sans text-xs font-semibold hover:bg-brand-blue/90 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed rounded transition-colors whitespace-nowrap"
                  >
                    {testingOllama ? '...' : 'TEST'}
                  </button>
                </div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 mb-2">
                  Connection will be tested when you send your first message.
                </div>
                <a 
                  href="https://ollama.com/blog/ollama-cloud" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[9px] text-brand-blue hover:underline"
                >
                  Get Ollama Cloud API Key →
                </a>
              </div>
            )}

            {/* Status */}
            <div className="h-4">
              {ollamaStatus === 'success' && (
                <div className="text-green-600 dark:text-green-500 text-xs font-sans">✓ Connected</div>
              )}
              {ollamaStatus === 'error' && (
                <div className="text-red-600 dark:text-red-500 text-xs font-sans">✗ {ollamaError}</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 bg-white dark:bg-[#0f0f11]">
          <button
            onClick={onClose}
            className="flex-1 md:flex-none px-6 py-3 border border-slate-300 dark:border-white/10 font-sans text-sm font-semibold hover:bg-slate-100 dark:hover:bg-[#1b1b1d] rounded transition-colors min-h-[48px] touch-manipulation"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="flex-1 md:flex-none px-6 py-3 bg-brand-blue text-white font-sans text-sm font-semibold hover:bg-brand-blue/90 rounded transition-colors min-h-[48px] touch-manipulation"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
};
