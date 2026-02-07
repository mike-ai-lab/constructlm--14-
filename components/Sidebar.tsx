import React, { useCallback } from 'react';
import { FileDocument } from '../types';
import { Button } from './ui/Button';

interface SidebarProps {
  files: FileDocument[];
  onUpload: (files: FileList) => void;
  onDelete: (id: string) => void;
  isUploading: boolean;
  uploadStatus: string;
  aiModel: 'gemini' | 'cerebras';
  onModelChange: (model: 'gemini' | 'cerebras') => void;
  width: number;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  files, 
  onUpload, 
  onDelete, 
  isUploading, 
  uploadStatus,
  aiModel,
  onModelChange,
  width,
  onClose
}) => {
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
    // Reset input
    e.target.value = '';
  }, [onUpload]);

  const totalTokens = files.reduce((acc, f) => acc + (f.tokenCount || 0), 0);

  return (
    <div 
      className="w-full border-r-2 border-black flex flex-col h-full bg-gray-50 flex-shrink-0"
      style={{ width: window.innerWidth >= 768 ? `${width}px` : '100vw', maxWidth: '100vw' }}
    >
      <div className="p-4 border-b-2 border-black bg-white">
        <div className="flex justify-between items-center mb-3">
          <h1 className="font-mono text-base font-bold tracking-tight">CONSTRUCT_LM</h1>
          {onClose && (
            <button 
              onClick={onClose}
              className="md:hidden text-xl font-bold hover:bg-gray-100 px-2"
            >
              ×
            </button>
          )}
        </div>
        
        {/* AI Model Toggle - Compact */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => onModelChange('gemini')}
            className={`flex-1 px-2 py-1 text-[10px] font-mono font-bold transition-all ${
              aiModel === 'gemini'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            GEMINI
          </button>
          <button
            onClick={() => onModelChange('cerebras')}
            className={`flex-1 px-2 py-1 text-[10px] font-mono font-bold transition-all ${
              aiModel === 'cerebras'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            CEREBRAS
          </button>
        </div>
        
        <label className="block w-full cursor-pointer">
          <input 
            type="file" 
            multiple 
            accept=".txt,.md,.json,.csv" 
            className="hidden" 
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <div className={`w-full border border-dashed border-gray-400 p-2 text-center hover:border-black hover:bg-gray-50 transition-colors ${isUploading ? 'opacity-50' : ''}`}>
            <span className="font-mono text-[11px] font-bold">
              + ADD SOURCE
            </span>
          </div>
        </label>
        
        {isUploading && (
          <div className="mt-2 p-1 bg-black text-white text-[10px] font-mono truncate">
            {uploadStatus}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {files.length === 0 && (
          <div className="text-center mt-10 text-gray-400 font-mono text-sm">
            NO SOURCES INDEXED
          </div>
        )}
        
        {files.map(file => (
          <div key={file.id} className="group relative border border-gray-300 hover:border-black p-2 bg-white transition-all">
            <div className="flex justify-between items-start mb-1">
              <span className="font-mono text-xs font-bold truncate max-w-[280px]" title={file.name}>
                {file.name}
              </span>
              <button 
                onClick={() => onDelete(file.id)}
                className="opacity-0 group-hover:opacity-100 text-[10px] text-red-600 hover:underline font-mono ml-2"
              >
                DEL
              </button>
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>{file.type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
              <span>~{Math.round(file.tokenCount || 0)} TOKENS</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t-2 border-black bg-white">
        <div className="flex justify-between items-center font-mono text-[10px]">
          <span>CONTEXT USAGE</span>
          <span className={totalTokens > 30000 ? "text-red-600 font-bold" : ""}>
            {Math.round(totalTokens).toLocaleString()} / 1M
          </span>
        </div>
        <div className="w-full bg-gray-200 h-1.5 mt-1.5 border border-black">
          <div 
            className="bg-black h-full transition-all duration-500" 
            style={{ width: `${Math.min((totalTokens / 1000000) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
