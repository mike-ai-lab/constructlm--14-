import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Copy, Download, RotateCcw } from 'lucide-react';

interface CanvasProps {
  code: string;
  filename: string;
  isOpen: boolean;
  onClose: () => void;
  error?: {message: string; code: string} | null;
  onError?: (errorMessage: string | null, code: string) => void;
  onFixError?: (code: string) => void;
  aiModel?: 'gemini' | 'cerebras' | 'groq' | 'openrouter' | 'ollama';
  isFixingError?: boolean;
  initialVersions?: Array<{ code: string; timestamp: number }>;
  initialVersionIndex?: number;
  onVersionsChange?: (versions: Array<{ code: string; timestamp: number }>, currentIndex: number) => void;
}

interface CodeVersion {
  code: string;
  timestamp: number;
}

declare global {
  interface Window {
    ReactComponentRenderer: any;
  }
}

export const Canvas: React.FC<CanvasProps> = ({ 
  code, 
  filename, 
  isOpen, 
  onClose, 
  error, 
  onError, 
  onFixError, 
  aiModel, 
  isFixingError,
  initialVersions,
  initialVersionIndex,
  onVersionsChange
}) => {
  const [showCode, setShowCode] = useState(false);
  const [editCode, setEditCode] = useState(code);
  const [isRendering, setIsRendering] = useState(false);
  const [rendererLoaded, setRendererLoaded] = useState(false);
  const [rendererError, setRendererError] = useState<string>('');
  const [versions, setVersions] = useState<CodeVersion[]>(
    initialVersions && initialVersions.length > 0 
      ? initialVersions 
      : [{ code, timestamp: Date.now() }]
  );
  const [currentVersionIndex, setCurrentVersionIndex] = useState(
    initialVersionIndex !== undefined ? initialVersionIndex : 0
  );
  const [copyFeedback, setCopyFeedback] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rendererRef = useRef<any>(null);
  const hadErrorRef = useRef<boolean>(false);
  const lastRenderedCodeRef = useRef<string>('');

  // Track error state changes
  useEffect(() => {
    hadErrorRef.current = !!error;
  }, [error]);

  // Notify parent of version changes
  useEffect(() => {
    if (onVersionsChange) {
      onVersionsChange(versions, currentVersionIndex);
    }
  }, [versions, currentVersionIndex]);

  // Initialize renderer on mount
  useEffect(() => {
    const initRenderer = async () => {
      setRendererError('Loading renderer...');
      if (!window.ReactComponentRenderer) {
        const script = document.createElement('script');
        script.src = '/ReactComponentRenderer.enhanced.js';
        script.onload = () => {
          rendererRef.current = new window.ReactComponentRenderer();
          setRendererLoaded(true);
          setRendererError('');
          if (isOpen && code && code !== lastRenderedCodeRef.current) {
            lastRenderedCodeRef.current = code;
            handleRender(code);
          }
        };
        script.onerror = () => {
          setRendererError('FAILED TO LOAD RENDERER SCRIPT! Path: /ReactComponentRenderer.enhanced.js');
        };
        document.head.appendChild(script);
      } else {
        rendererRef.current = new window.ReactComponentRenderer();
        setRendererLoaded(true);
        setRendererError('');
        if (isOpen && code && code !== lastRenderedCodeRef.current) {
          lastRenderedCodeRef.current = code;
          handleRender(code);
        }
      }
    };

    // Listen for errors from iframe
    const handleIframeError = (event: any) => {
      if (event.data?.type === 'renderer-error' && editCode) {
        onError?.(event.data.message, editCode);
      }
    };

    window.addEventListener('message', handleIframeError);
    initRenderer();
    
    return () => {
      window.removeEventListener('message', handleIframeError);
    };
  }, []);

  // Update initial state when code changes
  useEffect(() => {
    if (isOpen && code && rendererRef.current && code !== lastRenderedCodeRef.current) {
      lastRenderedCodeRef.current = code;
      
      // Check if we have saved versions
      if (initialVersions && initialVersions.length > 0) {
        // Use saved versions - don't reset
        const currentCode = versions[currentVersionIndex]?.code || code;
        setEditCode(currentCode);
        handleRender(currentCode);
      } else {
        // New code from AI - create first version
        setEditCode(code);
        const newVersion: CodeVersion = { code, timestamp: Date.now() };
        setVersions([newVersion]);
        setCurrentVersionIndex(0);
        handleRender(code);
      }
    }
  }, [code, isOpen]);

  const handleRender = async (codeToRender: string) => {
    if (!rendererRef.current || !iframeRef.current) {
      console.error('[Canvas] Renderer or iframe not available');
      return;
    }

    setIsRendering(true);

    try {
      await rendererRef.current.renderToIframe(iframeRef.current, codeToRender);
      // Only clear error if we had an error before (prevents infinite loop)
      if (hadErrorRef.current) {
        onError?.(null as any, '');
        hadErrorRef.current = false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[Canvas] Render error:', errorMsg);
      onError?.(errorMsg, codeToRender);
      hadErrorRef.current = true;
    } finally {
      setIsRendering(false);
    }
  };

  const handleSwitchToPreview = async () => {
    // Save as new version if code has changed
    const currentVersionCode = versions[currentVersionIndex]?.code || '';
    if (editCode !== currentVersionCode) {
      const newVersion: CodeVersion = { code: editCode, timestamp: Date.now() };
      const newVersions = versions.slice(0, currentVersionIndex + 1);
      newVersions.push(newVersion);
      setVersions(newVersions);
      setCurrentVersionIndex(newVersions.length - 1);
    }
    
    // First render the code, THEN switch to preview
    if (rendererRef.current && iframeRef.current) {
      try {
        await rendererRef.current.renderToIframe(iframeRef.current, editCode);
        // Only clear error if we had an error before
        if (hadErrorRef.current) {
          onError?.(null, '');
          hadErrorRef.current = false;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[Canvas] Manual render error:', errorMsg);
        onError?.(errorMsg, editCode);
        hadErrorRef.current = true;
      }
    }
    setShowCode(false);
  };

  const handleRefreshRender = () => {
    handleRender(editCode);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(editCode).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }).catch(err => {
      console.error('[Canvas] Failed to copy:', err);
    });
  };

  const handleSelectAll = () => {
    const textarea = document.querySelector('.canvas-code-editor') as HTMLTextAreaElement;
    if (textarea) {
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      // Also copy to clipboard for convenience
      navigator.clipboard.writeText(editCode).then(() => {
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
      });
    }
  };

  const handleDownloadCode = () => {
    // Determine file extension
    const ext = filename.includes('.') ? filename.split('.').pop() : 'jsx';
    const finalFilename = filename.includes('.') ? filename : `${filename}.${ext}`;
    
    // Create blob and download
    const blob = new Blob([editCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    
    // Trigger download silently
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(url);
  };

  const handlePreviousVersion = () => {
    if (currentVersionIndex > 0) {
      const newIndex = currentVersionIndex - 1;
      setCurrentVersionIndex(newIndex);
      const versionCode = versions[newIndex].code;
      setEditCode(versionCode);
      if (!showCode) {
        handleRender(versionCode);
      }
    }
  };

  const handleNextVersion = () => {
    if (currentVersionIndex < versions.length - 1) {
      const newIndex = currentVersionIndex + 1;
      setCurrentVersionIndex(newIndex);
      const versionCode = versions[newIndex].code;
      setEditCode(versionCode);
      if (!showCode) {
        handleRender(versionCode);
      }
    }
  };

  if (!isOpen) return null;

  const canGoPrevious = currentVersionIndex > 0;
  const canGoNext = currentVersionIndex < versions.length - 1;

  return (
    <div 
      className="w-full h-full min-h-screen md:min-h-0 bg-black md:border-l border-white/5 flex flex-col z-40 md:rounded-2xl overflow-hidden"
      style={{
        minHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))'
      }}
    >
      {/* Canvas Header - Safe area top */}
      <div 
        className="h-[60px] md:h-[72px] border-b border-white/5 flex items-center justify-between md:justify-end px-3 md:px-4 flex-shrink-0 overflow-x-auto bg-black"
        style={{
          paddingTop: 'max(0.75rem, env(safe-area-inset-top))'
        }}
      >
        {/* Mobile: Back button */}
        <button
          onClick={onClose}
          className="md:hidden flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
          title="Back to chat"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Version Navigation */}
          <button
            onClick={handlePreviousVersion}
            disabled={!canGoPrevious}
            className={`h-10 w-10 md:h-8 md:w-8 flex items-center justify-center rounded border transition-all flex-shrink-0 touch-manipulation ${
              canGoPrevious
                ? 'border-white/5 text-gray-500 hover:bg-white/5 hover:text-white cursor-pointer'
                : 'border-white/5 text-gray-700 cursor-not-allowed opacity-50'
            }`}
            title="Previous version"
          >
            <ChevronLeft size={16} className="md:w-3.5 md:h-3.5" />
          </button>

          <div className="text-[8px] md:text-[7px] text-gray-500 px-1 font-bold whitespace-nowrap flex-shrink-0">
            {currentVersionIndex + 1}/{versions.length}
          </div>

          <button
            onClick={handleNextVersion}
            disabled={!canGoNext}
            className={`h-10 w-10 md:h-8 md:w-8 flex items-center justify-center rounded border transition-all flex-shrink-0 touch-manipulation ${
              canGoNext
                ? 'border-white/5 text-gray-500 hover:bg-white/5 hover:text-white cursor-pointer'
                : 'border-white/5 text-gray-700 cursor-not-allowed opacity-50'
            }`}
            title="Next version"
          >
            <ChevronRight size={16} className="md:w-3.5 md:h-3.5" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Action Buttons */}
          <button
            onClick={handleRefreshRender}
            disabled={isRendering}
            className={`h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-lg border transition-all touch-manipulation ${
              isRendering
                ? 'border-white/5 text-gray-700 cursor-not-allowed opacity-50'
                : 'border-white/5 text-gray-500 hover:bg-white/5 hover:text-white'
            }`}
            title="Refresh render"
          >
            <RotateCcw size={18} className="md:w-4 md:h-4" />
          </button>

          <button
            onClick={handleCopyCode}
            className="h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-lg border border-white/5 text-gray-500 hover:bg-white/5 hover:text-white transition-all touch-manipulation"
            title="Copy code"
          >
            <Copy size={18} className="md:w-4 md:h-4" />
          </button>

          <button
            onClick={handleDownloadCode}
            className="h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-lg border border-white/5 text-gray-500 hover:bg-white/5 hover:text-white transition-all touch-manipulation"
            title="Download code"
          >
            <Download size={18} className="md:w-4 md:h-4" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Preview/Code Toggle */}
          <button
            onClick={handleSwitchToPreview}
            className={`h-10 px-4 text-[8px] font-bold uppercase tracking-[0.3em] border rounded-lg transition-all ${
              !showCode
                ? 'bg-blue-600 text-white border-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                : 'bg-transparent text-gray-500 border-white/5 hover:bg-white/5'
            }`}
          >
            ▶ PREVIEW
          </button>

          <button
            onClick={() => setShowCode(true)}
            className={`h-10 px-4 text-[8px] font-bold uppercase tracking-[0.3em] border rounded-lg transition-all ${
              showCode
                ? 'bg-blue-600 text-white border-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                : 'bg-transparent text-gray-500 border-white/5 hover:bg-white/5'
            }`}
          >
            {'{ } CODE'}
          </button>

          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all border border-white/5"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Canvas Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {showCode ? (
          // Code Editor View
          <div className="flex-1 flex flex-col overflow-hidden">
            <textarea
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              className="canvas-code-editor flex-1 bg-[#0a0a0c] text-gray-300 font-mono text-[13px] p-6 resize-none focus:outline-none border-none overflow-y-auto"
              placeholder="Edit your code here..."
              spellCheck="false"
            />

            {/* Footer with instructions and buttons - Safe area bottom */}
            <div 
              className="border-t border-white/5 px-3 md:px-6 py-3 bg-black/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2"
              style={{
                paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))'
              }}
            >
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] hidden md:block">
                💡 Edit code and render to see changes
              </div>
              <div className="flex gap-2 flex-1 md:flex-initial">
                <button
                  onClick={handleSelectAll}
                  className="flex-1 md:flex-initial px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-[9px] font-bold uppercase tracking-wider rounded transition-colors touch-manipulation"
                  title="Select all code and copy to clipboard"
                >
                  Select All
                </button>
                <button
                  onClick={handleSwitchToPreview}
                  className="flex-1 md:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold uppercase tracking-wider rounded transition-colors touch-manipulation"
                  title="Render your edited code"
                >
                  ▶ Render & Preview
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Preview View
          <div className="flex-1 overflow-hidden relative">
            {/* Renderer Error - Visible on screen */}
            {rendererError && (
              <div className="absolute inset-0 bg-red-900 flex items-center justify-center z-50 p-4">
                <div className="text-white text-center">
                  <div className="text-2xl mb-4">⚠️</div>
                  <div className="text-lg font-bold mb-2">RENDERER ERROR</div>
                  <div className="text-sm">{rendererError}</div>
                </div>
              </div>
            )}
            
            {isRendering && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                    Rendering...
                  </div>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20 backdrop-blur-sm">
                <div className="max-w-[500px] bg-red-950/40 border border-red-500/30 rounded-lg p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold text-red-400 uppercase tracking-wider mb-2">
                        Rendering Error
                      </div>
                      <div className="text-[11px] text-gray-300 leading-relaxed font-mono whitespace-pre-wrap break-words">
                        {error.message}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => onFixError?.(error.code)}
                      disabled={isFixingError}
                      className={`flex-1 px-4 py-2 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                        isFixingError
                          ? 'bg-gray-600 cursor-not-allowed opacity-50'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isFixingError ? 'Sending to Chat...' : 'Ask AI to Fix'}
                    </button>
                    <button
                      onClick={() => setShowCode(true)}
                      disabled={isFixingError}
                      className={`flex-1 px-4 py-2 text-gray-300 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${
                        isFixingError
                          ? 'bg-white/5 border-white/5 cursor-not-allowed opacity-50'
                          : 'bg-white/5 hover:bg-white/10 border-white/10'
                      }`}
                    >
                      View Code
                    </button>
                    <button
                      onClick={() => onError?.(null, '')}
                      disabled={isFixingError}
                      className={`px-4 py-2 text-gray-400 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${
                        isFixingError
                          ? 'bg-white/5 border-white/5 cursor-not-allowed opacity-50'
                          : 'bg-white/5 hover:bg-white/10 border-white/10'
                      }`}
                      title="Dismiss error"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0 bg-white"
              style={{
                minHeight: 'calc(100vh - 60px - env(safe-area-inset-top) - env(safe-area-inset-bottom))'
              }}
              sandbox="allow-scripts allow-same-origin"
              title="Canvas Preview"
              onLoad={() => {
                // Prevent nested app loading - intercept link clicks and button navigation
                try {
                  const iframeDoc = iframeRef.current?.contentDocument;
                  if (iframeDoc) {
                    // Prevent all navigation
                    iframeDoc.addEventListener('click', (e: any) => {
                      if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
                        e.preventDefault();
                        e.stopPropagation();
                        console.warn('[Canvas] Prevented nested navigation - click blocked');
                      }
                    }, true);
                    
                    // Also disable form submissions
                    iframeDoc.addEventListener('submit', (e: any) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.warn('[Canvas] Prevented form submission in iframe');
                    }, true);
                  }
                } catch (err) {
                  console.log('[Canvas] Cross-origin iframe - native sandbox is handling security');
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Copy Feedback Toast */}
      {copyFeedback && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">
          Copied to clipboard
        </div>
      )}
    </div>
  );
};
