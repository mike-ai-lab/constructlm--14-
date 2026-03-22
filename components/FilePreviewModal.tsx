import React, { useState, useEffect, useRef } from 'react';
/* Added Download icon for the new feature */
import { X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Download } from 'lucide-react';
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

  const isPdf = file?.type === 'application/pdf';
  const isMarkdown = file?.name.endsWith('.md');
  const hasContent = file?.content || file?.fileData;

  /* Helper to trigger file download */
  const handleDownload = () => {
    if (!file) return;
    const element = document.createElement("a");
    const blob = isPdf 
      ? new Blob([Uint8Array.from(atob(file.fileData!), c => c.charCodeAt(0))], { type: 'application/pdf' })
      : new Blob([file.content || ''], { type: 'text/plain' });
    
    element.href = URL.createObjectURL(blob);
    element.download = file.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleZoomIn = () => isPdf ? setPdfScale(p => Math.min(p + 0.2, 3.0)) : setTextScale(p => Math.min(p + 0.1, 2.0));
  const handleZoomOut = () => isPdf ? setPdfScale(p => Math.max(p - 0.2, 0.5)) : setTextScale(p => Math.max(p - 0.1, 0.5));
  const handleResetZoom = () => isPdf ? setPdfScale(1.0) : setTextScale(1.0);

  useEffect(() => {
    if (!isPdf || !file?.fileData) return;
    const loadPdf = async () => {
      try {
        if (!(window as any).pdfjsLib) return;
        const pdfData = atob(file.fileData!);
        const pdfArray = new Uint8Array(pdfData.length);
        for (let i = 0; i < pdfData.length; i++) pdfArray[i] = pdfData.charCodeAt(i);
        const pdf = await (window as any).pdfjsLib.getDocument({ data: pdfArray }).promise;
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
      } catch (error) { console.error("PDF Load Error:", error); }
    };
    loadPdf();
  }, [isPdf, file?.fileData]);

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;
    const renderPage = async () => {
      try {
        setLoading(true);
        const page = await pdfDocument.getPage(pageNumber);
        
        // Get container width for responsive scaling
        const container = canvasRef.current?.parentElement;
        const containerWidth = container ? container.clientWidth - 32 : window.innerWidth - 32; // Account for padding
        
        // Calculate scale to fit container
        const baseViewport = page.getViewport({ scale: 1.0 });
        const scale = Math.min(pdfScale, containerWidth / baseViewport.width);
        
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;
        
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';
        
        await page.render({ 
          canvasContext: context, 
          viewport: viewport, 
          transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null 
        }).promise;
        setLoading(false);
      } catch (error) { 
        console.error('PDF render error:', error);
        setLoading(false); 
      }
    };
    renderPage();
  }, [pdfDocument, pageNumber, pdfScale]);

  if (!file) return null;

  return (
    <>
      {/* Dimmed Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 animate-fadeIn" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
        <div 
          className="bg-white dark:bg-[#1a1a1d] rounded-xl shadow-2xl flex flex-col pointer-events-auto animate-slideUp overflow-hidden w-full h-full sm:h-auto sm:max-h-[92vh] sm:w-auto sm:max-w-[95vw] border border-slate-200 dark:border-white/5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Minimalist One-Line Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-white/5 gap-2 sm:gap-6 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <h2 className="text-[10px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[120px] sm:max-w-[180px]">
                {file.name}
              </h2>
              {isPdf && numPages > 0 && (
                <span className="text-[9px] sm:text-[10px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500 font-medium whitespace-nowrap">
                  {pageNumber} / {numPages}
                </span>
              )}
            </div>

            {/* Combined Controls & Actions */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              {isPdf && numPages > 1 && (
                <div className="flex items-center mr-0.5 sm:mr-1 bg-slate-50 dark:bg-white/5 rounded-md p-0.5">
                  <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1} className="p-1 hover:bg-white dark:hover:bg-white/10 rounded disabled:opacity-20 transition-all touch-manipulation"><ChevronLeft size={13} className="sm:w-[14px] sm:h-[14px]"/></button>
                  <button onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages} className="p-1 hover:bg-white dark:hover:bg-white/10 rounded disabled:opacity-20 transition-all touch-manipulation"><ChevronRight size={13} className="sm:w-[14px] sm:h-[14px]"/></button>
                </div>
              )}
              <button onClick={handleZoomOut} className="p-1 sm:p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors touch-manipulation" title="Zoom Out"><ZoomOut size={13} className="sm:w-[14px] sm:h-[14px]"/></button>
              <button onClick={handleZoomIn} className="p-1 sm:p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors touch-manipulation" title="Zoom In"><ZoomIn size={13} className="sm:w-[14px] sm:h-[14px]"/></button>
              
              <div className="w-px h-3 sm:h-4 bg-slate-200 dark:bg-white/10 mx-0.5 sm:mx-1" />
              
              <button onClick={handleDownload} className="p-1 sm:p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-colors touch-manipulation" title="Download File"><Download size={14} className="sm:w-[15px] sm:h-[15px]"/></button>
              <button onClick={onClose} className="p-1 sm:p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors touch-manipulation" title="Close"><X size={15} className="sm:w-4 sm:h-4"/></button>
            </div>
          </div>

          {/* Adaptive Content Area */}
          <div className="flex-1 overflow-auto bg-gray-50/30 dark:bg-[#0d0d0f]">
            {isPdf && file.fileData ? (
              <div className="flex justify-center items-start p-2 sm:p-4 min-h-full">
                {loading && <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-black/40 text-[10px] uppercase tracking-widest font-bold">Rendering...</div>}
                <canvas 
                  ref={canvasRef} 
                  className="shadow-lg rounded-sm border border-slate-200 dark:border-transparent max-w-full" 
                  style={{ 
                    width: '100%',
                    maxWidth: '100%',
                    height: 'auto',
                    display: 'block'
                  }} 
                />
              </div>
            ) : (
              <div className="p-4 sm:p-6 min-w-0 max-w-full sm:min-w-[600px] sm:max-w-4xl mx-auto">
                {isMarkdown && file.content ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none" style={{ fontSize: `${textScale}rem` }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{file.content}</ReactMarkdown>
                  </div>
                ) : (
                  <pre className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono text-[10px] sm:text-[11px] leading-relaxed overflow-x-auto" style={{ fontSize: `${textScale}rem` }}>
                    {file.content || "No content available for preview."}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.1s ease-out; }
        .animate-slideUp { animation: slideUp 0.15s cubic-bezier(0, 0, 0.2, 1); }
      `}</style>
    </>
  );
};