import React, { useCallback, useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { FileDocument, ChatSession } from '../types';
import { Button } from './ui/Button';

interface SidebarProps {
  files: FileDocument[];
  onUpload: (files: FileList) => void;
  onDelete: (id: string) => void;
  onToggleFile: (id: string, isEnabled: boolean) => void;
  isUploading: boolean;
  uploadStatus: string;
  width: number;
  onClose?: () => void;
  onOpenSettings: () => void;
  chatSessions: ChatSession[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onExportChat: (id: string) => void;
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  files, 
  onUpload, 
  onDelete,
  onToggleFile,
  isUploading, 
  uploadStatus,
  width,
  onClose,
  onOpenSettings,
  chatSessions,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onExportChat,
  isCollapsed = false
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'sources'>('sources');
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
      className={`w-full flex flex-col h-full bg-white dark:bg-[#0f0f11] flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}
      style={{ 
        width: window.innerWidth >= 768 ? `${width}px` : '100vw', 
        maxWidth: '100vw',
        paddingTop: onClose ? 'calc(60px + env(safe-area-inset-top))' : '0'
      }}
    >
      <style>{`
        /* Scribble Checkbox Integration */
        .checkbox-wrapper input[type="checkbox"] {
          visibility: hidden;
          display: none;
        }

        .checkbox-wrapper *,
        .checkbox-wrapper ::after,
        .checkbox-wrapper ::before {
          box-sizing: border-box;
          user-select: none;
        }

        .checkbox-wrapper {
          position: relative;
          display: block;
          overflow: hidden;
          width: 45px;
          height: 45px;
          margin-top: -12px;
          margin-left: -12px;
        }

        .checkbox-wrapper .label {
          cursor: pointer;
        }

        .checkbox-wrapper .check {
          width: 45px;
          height: 45px;
          position: absolute;
          opacity: 0;
          z-index: 10;
        }

        .checkbox-wrapper .label svg {
          vertical-align: middle;
        }

        .checkbox-wrapper .path1 {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          transition: .5s stroke-dashoffset;
          opacity: 0;
        }

        .checkbox-wrapper .check:checked + label svg g path {
          stroke-dashoffset: 0;
          opacity: 1;
        }

        /* Sidebar Scrollbar Styling */
        .sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(155, 155, 155, 0.1);
          border-radius: 10px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(155, 155, 155, 0.2);
        }
      `}</style>

      <div className="flex border-b border-slate-200 dark:border-white/5 shrink-0 h-14 items-center px-4 gap-3 bg-white dark:bg-[#0f0f11]">
        {['CHATS', 'SOURCES'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase() as 'chats' | 'sources')}
            className={`flex-1 h-9 font-bold text-[10px] uppercase transition-all duration-200 rounded ${
              activeTab === tab.toLowerCase()
              ? 'bg-brand-blue text-white shadow-lg' 
              : 'bg-slate-50 dark:bg-[#1b1b1d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0a0a0b]'
            }`}
          >
            {tab}
          </button>
        ))}
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden absolute right-3 px-3 text-xl font-bold hover:bg-slate-100 dark:hover:bg-surface-700 rounded"
          >
            ×
          </button>
        )}
      </div>

      <div className="p-6 pr-4 flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll">
        {activeTab === 'chats' ? (
          <>
            {/* New Chat Button */}
            <button
              onClick={onNewChat}
              className="w-full border border-dashed border-slate-300 dark:border-white/10 p-6 mb-6 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-[#1b1b1d] hover:border-brand-blue/30 group rounded-lg transition-all"
            >
              <Plus className="mb-2 group-hover:rotate-90 transition-transform text-slate-400 dark:text-slate-500" size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">+ New Chat</span>
            </button>
            
            {chatSessions.length === 0 && (
              <div className="text-center mt-10 text-slate-400 dark:text-slate-500 font-sans text-xs opacity-60">
                No chat history
              </div>
            )}
            
            {chatSessions.map(session => (
              <div 
                key={session.id}
                className={`group relative mb-3 border p-2 bg-white dark:bg-[#1b1b1d] transition-all cursor-pointer rounded-lg min-h-[50px] ${
                  currentChatId === session.id 
                    ? 'border-brand-blue shadow-lg ring-1 ring-brand-blue/20' 
                    : 'border-slate-200 dark:border-white/10 opacity-60 hover:opacity-100 hover:border-brand-blue/30'
                }`}
                onClick={() => onSelectChat(session.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-sans text-xs font-semibold truncate max-w-[150px]" title={session.title}>
                    {session.title}
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportChat(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[10px] hover:bg-slate-100 dark:hover:bg-[#0a0a0b] p-1 rounded transition-all"
                      title="Export"
                    >
                      <Download size={12} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-red-500 hover:text-red-600 font-sans px-1"
                    >
                      Del
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                  <span>{session.messages.length} msgs</span>
                  <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {/* Add Source Button */}
            <label className="block w-full cursor-pointer">
              <input 
                type="file" 
                multiple 
                accept=".txt,.md,.json,.csv,.pdf" 
                className="hidden" 
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <div className={`w-full border border-dashed border-slate-300 dark:border-white/10 p-6 mb-6 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-[#1b1b1d] hover:border-brand-blue/30 group rounded-lg transition-all ${isUploading ? 'opacity-50' : ''}`}>
                <Plus className="mb-2 group-hover:rotate-90 transition-transform text-slate-400 dark:text-slate-500" size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Add Source</span>
              </div>
            </label>
            
            {isUploading && (
              <div className="mt-2 p-2 bg-brand-blue/10 text-brand-blue text-[10px] font-sans truncate rounded border border-brand-blue/20">
                {uploadStatus}
              </div>
            )}
            
            {files.length === 0 && (
              <div className="text-center mt-10 text-slate-400 dark:text-slate-500 font-sans text-xs opacity-60">
                No sources indexed
              </div>
            )}
            
            <div className="space-y-3">
              {files.map(file => (
                <div 
                  key={file.id}
                  onClick={() => onToggleFile(file.id, !(file.isEnabled !== false))}
                  className={`border p-2 cursor-pointer transition-all rounded-lg min-h-[50px] ${
                    file.isEnabled !== false
                    ? 'border-brand-blue bg-white dark:bg-[#1b1b1d] shadow-lg ring-1 ring-brand-blue/20' 
                    : 'border-slate-200 dark:border-white/10 opacity-60 hover:opacity-100 hover:border-brand-blue/30 bg-white dark:bg-[#1b1b1d]'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="checkbox-wrapper shrink-0">
                      <input 
                        type="checkbox" 
                        className="check" 
                        id={`check-${file.id}`}
                        checked={file.isEnabled !== false}
                        onChange={() => {}} 
                      />
                      <label htmlFor={`check-${file.id}`} className="label">
                        <svg width={45} height={45} viewBox="0 0 95 95">
                          <rect x={30} y={20} width={50} height={50} stroke="black" strokeWidth={3} fill="none" />
                          <g transform="translate(0,-952.36222)">
                            <path 
                              d="m 56,963 c -102,122 6,9 7,9 17,-5 -66,69 -38,52 122,-77 -7,14 18,4 29,-11 45,-43 23,-4" 
                              stroke="black" 
                              strokeWidth={3} 
                              fill="none" 
                              className="path1" 
                            />
                          </g>
                        </svg>
                      </label>
                    </div>

                    <div className="flex-1 min-w-0 mt-2">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-semibold text-[11px] truncate uppercase max-w-[200px] font-sans" title={file.name}>
                          {file.name}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(file.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[10px] text-red-500 hover:text-red-600 font-sans ml-2 px-1"
                        >
                          Del
                        </button>
                      </div>
                      <div className="text-[9px] mt-1 text-slate-400 dark:text-slate-500 font-semibold">
                        ~{Math.round(file.tokenCount || 0)} tokens
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="h-[88px] p-4 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f0f11] flex flex-col justify-center flex-shrink-0">
        <div className="flex justify-between items-center font-sans text-[10px] mb-2 font-semibold">
          <span className="text-slate-600 dark:text-slate-400">Context Usage</span>
          <span className={totalTokens > 30000 ? "text-red-500 font-bold" : "text-slate-600 dark:text-slate-400"}>
            {Math.round(totalTokens).toLocaleString()} / 1M
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-[#0a0a0b] h-2 border border-slate-200 dark:border-white/10 rounded-full overflow-hidden">
          <div 
            className="bg-brand-blue h-full transition-all duration-500 rounded-full" 
            style={{ width: `${Math.min((totalTokens / 1000000) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
