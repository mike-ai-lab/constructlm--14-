import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { FileDocument } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FilePreviewModalProps {
  file: FileDocument | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const [textScale, setTextScale] = useState(1.0);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isPdf = file?.type === 'application/pdf';
  const isMarkdown = file?.name.endsWith('.md');
  const hasContent = file?.content || file?.fileData;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleZoomIn = () => {
    if (isPdf) {
      setPdfScale(prev => Math.min(prev + 0.2, 3.0));
    } else {
      setTextScale(prev => Math.min(prev + 0.1, 2.0));
    }
  };
  
  const handleZoomOut = () => {
    if (isPdf) {
      setPdfScale(prev => Math.max(prev - 0.2, 0.5));
    } else {
      setTextScale(prev => Math.max(prev - 0.1, 0.5));
    }
  };
  
  const handleResetZoom = () => {
    if (isPdf) {
      setPdfScale(1.0);
    } else {
      setTextScale(1.0);
    }
  };

  // Load PDF document
  useEffect(() => {
    if (!isPdf || !file?.fileData) return;

    const loadPdf = async () => {
      try {
        if (!(window as any).pdfjsLib) {
          console.error('PDF.js not loaded');
          return;
        }

        const pdfData = atob(file.fileData!);
        const pdfArray = new Uint8Array(pdfData.length);
        for (let i = 0; i < pdfData.length; i++) {
          pdfArray[i] = pdfData.charCodeAt(i);
        }

        const pdf = await (window as any).pdfjsLib.getDocument({ data: pdfArray }).promise;
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPdf();
  }, [isPdf, file?.fileData]);

  // Render PDF page
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        setLoading(true);
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale: pdfScale });
        
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          transform: transform
        }).promise;

        setLoading(false);
      } catch (error) {
        console.error('Error rendering PDF page:', error);
        setLoading(false);
      }
    };

    renderPage();
  }, [pdfDocument, pageNumber, pdfScale]);

  if (!file) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
        <div 
          className="bg-white dark:bg-[#1a1a1d] rounded-lg shadow-2xl w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[90vh] flex flex-col pointer-events-auto animate-slideUp safe-area-inset"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border-b border-slate-200 dark:border-white/10 gap-2 shrink-0">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                {file.name}
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-4 mt-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                <span>{formatSize(file.size)}</span>
                <span className="hidden sm:inline">{formatDate(file.uploadDate)}</span>
                <span>{Math.round(file.tokenCount || 0).toLocaleString()} tokens</span>
                {isPdf && numPages > 0 && <span>Page {pageNumber}/{numPages}</span>}
              </div>
            </div>
            
            {/* Controls - Mobile Optimized */}
            {hasContent && (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {isPdf && numPages > 1 && (
                  <>
                    <button
                      onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                      disabled={pageNumber <= 1}
                      className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      title="Previous Page"
                    >
                      <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                      disabled={pageNumber >= numPages}
                      className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      title="Next Page"
                    >
                      <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <div className="h-4 w-px bg-slate-300 dark:bg-white/10 mx-0.5 sm:mx-1"></div>
                  </>
                )}
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} className="sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <span className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400 min-w-[2.5rem] sm:min-w-[3rem] text-center">
                  {Math.round((isPdf ? pdfScale : textScale) * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
                  title="Zoom In"
                >
                  <ZoomIn size={14} className="sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="hidden sm:block p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCw size={16} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 sm:ml-4 p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors z-10 bg-white dark:bg-[#1a1a1d] shadow-lg sm:shadow-none touch-manipulation"
              aria-label="Close preview"
            >
              <X size={18} className="sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content Area - Mobile Optimized */}
          <div ref={containerRef} className="flex-1 overflow-auto bg-slate-50 dark:bg-[#0a0a0b]">
            {isPdf && file.fileData ? (
              <div className="flex items-start sm:items-center justify-center p-2 sm:p-6 min-h-full">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50">
                    <div className="text-gray-600 dark:text-gray-400 text-sm">Loading...</div>
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className="shadow-lg w-full sm:w-auto"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
            ) : isMarkdown && file.content ? (
              <div 
                className="p-4 sm:p-6 prose prose-sm sm:prose prose-slate dark:prose-invert max-w-none"
                style={{ fontSize: `${textScale}rem` }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {file.content}
                </ReactMarkdown>
              </div>
            ) : file.content ? (
              <pre 
                className="p-4 sm:p-6 text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed text-xs sm:text-sm"
                style={{ fontSize: `${textScale}rem` }}
              >
                {file.content}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4 sm:p-6">
                <div className="text-center max-w-md">
                  <p className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Preview Not Available</p>
                  <p className="text-xs sm:text-sm mb-1 sm:mb-2">This file was uploaded before the preview feature was added.</p>
                  <p className="text-xs sm:text-sm">To enable preview, delete this file and upload it again.</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Mobile Optimized with Safe Area */}
          <div className="flex items-center justify-end gap-3 p-3 sm:p-4 border-t border-slate-200 dark:border-white/10 shrink-0 safe-area-bottom">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium touch-manipulation"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        /* Safe area support for mobile devices */
        .safe-area-inset {
          padding-top: env(safe-area-inset-top);
        }

        .safe-area-bottom {
          padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
        }

        /* Prevent canvas overflow on mobile */
        @media (max-width: 640px) {
          canvas {
            max-width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>
    </>
  );
};
