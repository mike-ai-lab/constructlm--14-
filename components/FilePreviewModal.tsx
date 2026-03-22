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
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white dark:bg-[#1a1a1d] rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col pointer-events-auto animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {file.name}
              </h2>
              <div className="flex gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{formatSize(file.size)}</span>
                <span>{formatDate(file.uploadDate)}</span>
                <span>{Math.round(file.tokenCount || 0).toLocaleString()} tokens</span>
                {isPdf && numPages > 0 && <span>Page {pageNumber} of {numPages}</span>}
              </div>
            </div>
            
            {hasContent && (
              <div className="flex items-center gap-2 mx-4">
                {isPdf && numPages > 1 && (
                  <>
                    <button
                      onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                      disabled={pageNumber <= 1}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous Page"
                    >
                      <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                      disabled={pageNumber >= numPages}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next Page"
                    >
                      <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <div className="h-4 w-px bg-slate-300 dark:bg-white/10 mx-1"></div>
                  </>
                )}
                <button
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} className="text-gray-600 dark:text-gray-400" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
                  {Math.round((isPdf ? pdfScale : textScale) * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={16} className="text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCw size={16} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="ml-4 p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close preview"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div ref={containerRef} className="flex-1 overflow-auto bg-slate-50 dark:bg-[#0a0a0b]">
            {isPdf && file.fileData ? (
              <div className="flex items-center justify-center p-6 min-h-full">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50">
                    <div className="text-gray-600 dark:text-gray-400">Loading page...</div>
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className="shadow-lg"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
            ) : isMarkdown && file.content ? (
              <div 
                className="p-6 prose prose-slate dark:prose-invert max-w-none"
                style={{ fontSize: `${textScale}rem` }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {file.content}
                </ReactMarkdown>
              </div>
            ) : file.content ? (
              <pre 
                className="p-6 text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed"
                style={{ fontSize: `${textScale}rem` }}
              >
                {file.content}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 p-6">
                <div className="text-center max-w-md">
                  <p className="text-lg font-semibold mb-3">Preview Not Available</p>
                  <p className="text-sm mb-2">This file was uploaded before the preview feature was added.</p>
                  <p className="text-sm">To enable preview, delete this file and upload it again.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium"
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
      `}</style>
    </>
  );
};
