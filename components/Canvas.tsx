import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Copy, Download, RotateCcw } from 'lucide-react';
import { CodeEditor } from './CodeEditor';

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

  // CRITICAL: Reset versions when initialVersions changes (e.g., switching chats)
  useEffect(() => {
    console.log('[Canvas] initialVersions changed:', {
      hasInitialVersions: !!(initialVersions && initialVersions.length > 0),
      initialVersionsCount: initialVersions?.length || 0,
      initialIndex: initialVersionIndex
    });
    
    if (initialVersions && initialVersions.length > 0) {
      console.log('[Canvas] Setting versions from initialVersions');
      setVersions(initialVersions);
      setCurrentVersionIndex(initialVersionIndex !== undefined ? initialVersionIndex : 0);
    } else {
      console.log('[Canvas] No initialVersions - creating new version from code');
      setVersions([{ code, timestamp: Date.now() }]);
      setCurrentVersionIndex(0);
    }
  }, [initialVersions, initialVersionIndex]);

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
        // Check if script is already in DOM
        const existingScript = document.querySelector('script[src="/ReactComponentRenderer.enhanced.js"]');
        if (existingScript) {
          // Script is loading, wait for it
          existingScript.addEventListener('load', () => {
            rendererRef.current = new window.ReactComponentRenderer();
            setRendererLoaded(true);
            setRendererError('');
            if (isOpen && code && code !== lastRenderedCodeRef.current) {
              lastRenderedCodeRef.current = code;
              handleRender(code);
            }
          });
          return;
        }
        
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
    // If already in preview mode, just refresh render
    if (!showCode) {
      handleRender(editCode);
      return;
    }
    
    // Save as new version if code has changed
    const currentVersionCode = versions[currentVersionIndex]?.code || '';
    if (editCode !== currentVersionCode) {
      const newVersion: CodeVersion = { code: editCode, timestamp: Date.now() };
      const newVersions = versions.slice(0, currentVersionIndex + 1);
      newVersions.push(newVersion);
      setVersions(newVersions);
      setCurrentVersionIndex(newVersions.length - 1);
    }
    
    // Switch to preview immediately
    setShowCode(false);
    
    // Then render the code
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
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
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
      className="w-full h-full bg-black md:border-l border-white/5 flex flex-col z-40 md:rounded-2xl overflow-hidden shadow-2xl"
      style={{
        maxHeight: 'calc(100vh - 16px)',
        height: '100%'
      }}
    >
      {/* Canvas Header */}
      <div 
        className="h-[60px] md:h-[72px] border-b border-white/5 flex items-center justify-between md:justify-end px-3 md:px-4 flex-shrink-0 overflow-x-auto bg-black"
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
            onClick={handleSelectAll}
            className="h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-lg border border-white/5 text-gray-500 hover:bg-white/5 hover:text-white transition-all touch-manipulation"
            title="Select all code"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-4 md:h-4">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
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

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Preview/Code Toggle - Simplified equal size buttons */}
          <button
            onClick={handleSwitchToPreview}
            className={`h-10 w-10 md:h-10 md:w-10 flex items-center justify-center rounded-lg border transition-all touch-manipulation ${
              !showCode
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-transparent text-gray-500 border-white/5 hover:bg-white/5'
            }`}
            title="Preview"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>

          <button
            onClick={() => setShowCode(true)}
            className={`h-10 w-10 md:h-10 md:w-10 flex items-center justify-center rounded-lg border transition-all touch-manipulation ${
              showCode
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-transparent text-gray-500 border-white/5 hover:bg-white/5'
            }`}
            title="Code"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
          </button>

          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all border border-white/5 touch-manipulation"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Canvas Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {showCode ? (
          // Code Editor View with Monaco
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={editCode}
              onChange={(value) => setEditCode(value || '')}
              language="typescript"
              theme="dark"
            />
          </div>
        ) : (
          // Preview View
          <div className="flex-1 overflow-hidden relative">
            {/* Renderer Error - Only show actual errors, not loading state */}
            {rendererError && !rendererError.includes('Loading') && (
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
