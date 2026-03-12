import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Copy, Download, RotateCcw } from 'lucide-react';

interface CanvasProps {
  code: string;
  filename: string;
  isOpen: boolean;
  onClose: () => void;
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

export const Canvas: React.FC<CanvasProps> = ({ code, filename, isOpen, onClose }) => {
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

    initRenderer();
  }, []);

  // Update initial state when code changes
  useEffect(() => {
    if (isOpen && code && rendererRef.current) {
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
      console.error('[Canvas] Render error:', error);
    } finally {
      setIsRendering(false);
    }
  };

  const handleSwitchToPreview = () => {
    console.log('[Canvas] Switching to preview, rendering code');
    setShowCode(false);
    // Auto-render when switching to preview
    handleRender(editCode);
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
    <div className="fixed md:relative right-0 top-0 bottom-0 w-full md:w-[750px] bg-black border-l border-white/5 flex flex-col z-40 md:z-auto md:mr-[30px] md:mb-[30px] md:rounded-2xl overflow-hidden">
      {/* Canvas Header */}
      <div className="h-[72px] border-b border-white/5 flex items-center justify-between px-4 flex-shrink-0 overflow-x-auto">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">
          Interactive Canvas
        </div>
        <div className="flex items-center gap-1">
          {/* Version Navigation */}
          <button
            onClick={handlePreviousVersion}
            disabled={!canGoPrevious}
            className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-all ${
              canGoPrevious
                ? 'border-white/5 text-gray-500 hover:bg-white/5 hover:text-white cursor-pointer'
                : 'border-white/5 text-gray-700 cursor-not-allowed opacity-50'
            }`}
            title="Previous version"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="text-[8px] text-gray-500 px-2 font-bold">
            {currentVersionIndex + 1} / {versions.length}
          </div>

          <button
            onClick={handleNextVersion}
            disabled={!canGoNext}
            className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-all ${
              canGoNext
                ? 'border-white/5 text-gray-500 hover:bg-white/5 hover:text-white cursor-pointer'
                : 'border-white/5 text-gray-700 cursor-not-allowed opacity-50'
            }`}
            title="Next version"
          >
            <ChevronRight size={16} />
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

            {/* Save Version Hint */}
            <div className="border-t border-white/5 px-6 py-3 bg-black/50 text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">
              Switch to Preview to render and save version
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
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title="Canvas Preview"
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
