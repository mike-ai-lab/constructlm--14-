import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Copy, Download, RotateCcw } from 'lucide-react';

interface CanvasProps {
  code: string;
  filename: string;
  isOpen: boolean;
  onClose: () => void;
  error?: {message: string; code: string} | null;
  onError?: (errorMessage: string, code: string) => void;
  onFixError?: (code: string) => void;
  aiModel?: 'gemini' | 'cerebras' | 'groq' | 'openrouter' | 'ollama';
  isFixingError?: boolean;
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

export const Canvas: React.FC<CanvasProps> = ({ code, filename, isOpen, onClose, error, onError, onFixError, aiModel, isFixingError }) => {
  const [showCode, setShowCode] = useState(false);
  const [editCode, setEditCode] = useState(code);
  const [isRendering, setIsRendering] = useState(false);
  const [versions, setVersions] = useState<CodeVersion[]>([{ code, timestamp: Date.now() }]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rendererRef = useRef<any>(null);

  // Initialize renderer on mount
  useEffect(() => {
    const initRenderer = async () => {
      if (!window.ReactComponentRenderer) {
        const script = document.createElement('script');
        script.src = '/user/standalone_tools/ReactComponentRenderer.enhanced.js';
        script.onload = () => {
          rendererRef.current = new window.ReactComponentRenderer();
          console.log('[Canvas] Renderer initialized');
          if (isOpen && code) {
            handleRender(code);
          }
        };
        script.onerror = () => {
          console.error('[Canvas] Failed to load renderer');
        };
        document.head.appendChild(script);
      } else {
        rendererRef.current = new window.ReactComponentRenderer();
        console.log('[Canvas] Renderer already available');
        if (isOpen && code) {
          handleRender(code);
        }
      }
    };

    // Listen for errors from iframe
    const handleIframeError = (event: any) => {
      console.log('[Canvas] Iframe error event:', event.data);
      if (event.data?.type === 'renderer-error' && editCode) {
        onError?.(event.data.message, editCode);
      }
    };

    window.addEventListener('message', handleIframeError);
    initRenderer();
    
    return () => {
      window.removeEventListener('message', handleIframeError);
    };
  }, [editCode, onError]);

  // Update initial state when code changes
  useEffect(() => {
    if (isOpen && code && rendererRef.current) {
      console.log('[Canvas] New code received, clearing error state and rendering');
      // Always clear error when new code arrives
      // (This handles both AI-fixed code and user edits)
      setEditCode(code);
      setVersions([{ code, timestamp: Date.now() }]);
      setCurrentVersionIndex(0);
      handleRender(code);
    }
  }, [code, isOpen]);

  const handleRender = async (codeToRender: string) => {
    if (!rendererRef.current || !iframeRef.current) {
      console.error('[Canvas] Renderer or iframe not available');
      return;
    }

    console.log('[Canvas] Starting render, code length:', codeToRender.length);
    setIsRendering(true);

    try {
      await rendererRef.current.renderToIframe(iframeRef.current, codeToRender);
      console.log('[Canvas] Render complete');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[Canvas] Render error:', errorMsg);
      onError?.(errorMsg, codeToRender);
    } finally {
      setIsRendering(false);
    }
  };

  const handleSwitchToPreview = async () => {
    console.log('[Canvas] Switching to preview, rendering edited code');
    // First render the code, THEN switch to preview
    if (rendererRef.current && iframeRef.current) {
      try {
        await rendererRef.current.renderToIframe(iframeRef.current, editCode);
        console.log('[Canvas] Manual render complete');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[Canvas] Manual render error:', errorMsg);
        onError?.(errorMsg, editCode);
      }
    }
    setShowCode(false);
  };

  const handleRefreshRender = () => {
    console.log('[Canvas] User clicked refresh render button');
    handleRender(editCode);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(editCode).then(() => {
      console.log('[Canvas] Code copied to clipboard');
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }).catch(err => {
      console.error('[Canvas] Failed to copy:', err);
    });
  };

  const handleDownloadCode = () => {
    console.log('[Canvas] Downloading code, filename:', filename);
    
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
    console.log('[Canvas] Download triggered for:', finalFilename);
  };

  const handlePreviousVersion = () => {
    if (currentVersionIndex > 0) {
      const newIndex = currentVersionIndex - 1;
      setCurrentVersionIndex(newIndex);
      const versionCode = versions[newIndex].code;
      setEditCode(versionCode);
      console.log('[Canvas] Loaded previous version, index:', newIndex);
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
      console.log('[Canvas] Loaded next version, index:', newIndex);
      if (!showCode) {
        handleRender(versionCode);
      }
    }
  };

  const handleSaveVersion = () => {
    console.log('[Canvas] Saving new version, code length:', editCode.length);
    const newVersion: CodeVersion = { code: editCode, timestamp: Date.now() };
    const newVersions = versions.slice(0, currentVersionIndex + 1);
    newVersions.push(newVersion);
    setVersions(newVersions);
    setCurrentVersionIndex(newVersions.length - 1);
  };

  if (!isOpen) return null;

  const canGoPrevious = currentVersionIndex > 0;
  const canGoNext = currentVersionIndex < versions.length - 1;

  return (
    <div className="w-full h-full bg-black border-l border-white/5 flex flex-col z-40 rounded-2xl overflow-hidden">
      {/* Canvas Header */}
      <div className="h-[72px] border-b border-white/5 flex items-center justify-end px-4 flex-shrink-0 overflow-hidden">
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Version Navigation */}
          <button
            onClick={handlePreviousVersion}
            disabled={!canGoPrevious}
            className={`h-8 w-8 flex items-center justify-center rounded border transition-all flex-shrink-0 ${
              canGoPrevious
                ? 'border-white/5 text-gray-500 hover:bg-white/5 hover:text-white cursor-pointer'
                : 'border-white/5 text-gray-700 cursor-not-allowed opacity-50'
            }`}
            title="Previous version"
          >
            <ChevronLeft size={14} />
          </button>

          <div className="text-[7px] text-gray-500 px-1 font-bold whitespace-nowrap flex-shrink-0">
            {currentVersionIndex + 1}/{versions.length}
          </div>

          <button
            onClick={handleNextVersion}
            disabled={!canGoNext}
            className={`h-8 w-8 flex items-center justify-center rounded border transition-all flex-shrink-0 ${
              canGoNext
                ? 'border-white/5 text-gray-500 hover:bg-white/5 hover:text-white cursor-pointer'
                : 'border-white/5 text-gray-700 cursor-not-allowed opacity-50'
            }`}
            title="Next version"
          >
            <ChevronRight size={14} />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Action Buttons */}
          <button
            onClick={handleRefreshRender}
            disabled={isRendering}
            className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-all ${
              isRendering
                ? 'border-white/5 text-gray-700 cursor-not-allowed opacity-50'
                : 'border-white/5 text-gray-500 hover:bg-white/5 hover:text-white'
            }`}
            title="Refresh render"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={handleCopyCode}
            className="h-10 w-10 flex items-center justify-center rounded-lg border border-white/5 text-gray-500 hover:bg-white/5 hover:text-white transition-all"
            title="Copy code"
          >
            <Copy size={16} />
          </button>

          <button
            onClick={handleDownloadCode}
            className="h-10 w-10 flex items-center justify-center rounded-lg border border-white/5 text-gray-500 hover:bg-white/5 hover:text-white transition-all"
            title="Download code"
          >
            <Download size={16} />
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
              className="flex-1 bg-[#0a0a0c] text-gray-300 font-mono text-[13px] p-6 resize-none focus:outline-none border-none overflow-y-auto"
              placeholder="Edit your code here..."
              spellCheck="false"
            />

            {/* Footer with instructions and render button */}
            <div className="border-t border-white/5 px-6 py-3 bg-black/50 flex items-center justify-between">
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">
                💡 Edit code and render to see changes
              </div>
              <button
                onClick={handleSwitchToPreview}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold uppercase tracking-wider rounded transition-colors"
                title="Render your edited code"
              >
                ▶ Render & Preview
              </button>
            </div>
          </div>
        ) : (
          // Preview View
          <div className="flex-1 overflow-hidden relative">
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
                      {isFixingError ? '⏳ Fixing...' : '🔧 Fix Error'}
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
                      onClick={() => setShowCode(false)}
                      disabled={isFixingError}
                      className={`px-4 py-2 text-gray-400 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${
                        isFixingError
                          ? 'bg-white/5 border-white/5 cursor-not-allowed opacity-50'
                          : 'bg-white/5 hover:bg-white/10 border-white/10'
                      }`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
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
