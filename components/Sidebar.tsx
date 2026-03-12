import React, { useCallback, useState } from 'react';
import { Plus, Download, X } from 'lucide-react';
import { FileDocument, ChatSession } from '../types';

interface SidebarProps {
  files: FileDocument[];
  onUpload: (files: FileList) => void;
  onDelete: (id: string) => void;
  onToggleFile: (id: string, isEnabled: boolean) => void;
  isUploading: boolean;
  uploadStatus: string;
  width: number;
  onClose?: () => void;
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
    e.target.value = '';
  }, [onUpload]);

  const totalTokens = files.reduce((acc, f) => acc + (f.tokenCount || 0), 0);

  return (
    <div 
      className={`w-full flex flex-col h-full bg-black flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}
      style={{ 
        width: window.innerWidth >= 768 ? `${width}px` : '100vw', 
        maxWidth: '100vw',
        paddingTop: onClose ? 'calc(60px + env(safe-area-inset-top))' : '0'
      }}
    >
      <style>{`
        .sidebar-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }

        .sidebar-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

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

        .sidebar-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>

      <div className="flex border-b border-white/5 shrink-0 h-14 items-center px-4 gap-3 bg-black">
        {['CHATS', 'SOURCES'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase() as 'chats' | 'sources')}
            className={`flex-1 h-9 font-bold text-[10px] uppercase transition-all duration-200 rounded ${
              activeTab === tab.toLowerCase()
              ? 'bg-blue-600 text-white' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {tab}
          </button>
        ))}
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden absolute right-3 p-2 hover:bg-white/5 rounded"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll">
        {activeTab === 'chats' ? (
          <>
            <button
              onClick={onNewChat}
              className="w-full border border-white/10 p-4 mb-4 flex flex-col items-center justify-center hover:bg-white/5 group rounded-lg transition-all"
            >
              <Plus className="mb-2 group-hover:rotate-90 transition-transform text-gray-500" size={18} />
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">+ New Chat</span>
            </button>
            
            {chatSessions.length === 0 && (
              <div className="text-center mt-10 text-gray-600 text-xs opacity-60">
                No chat history
              </div>
            )}
            
            {chatSessions.map(session => (
              <div 
                key={session.id}
                className={`group relative mb-3 p-3 cursor-pointer rounded-lg min-h-[50px] transition-all ${
                  currentChatId === session.id 
                    ? 'bg-white/10 border border-blue-500/30' 
                    : 'sidebar-item hover:bg-white/5'
                }`}
                onClick={() => onSelectChat(session.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold truncate max-w-[150px] text-white" title={session.title}>
                    {session.title}
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportChat(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[10px] hover:bg-white/10 p-1 rounded transition-all text-gray-400"
                      title="Export"
                    >
                      <Download size={12} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-red-500 hover:text-red-400 px-1"
                    >
                      Del
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-[9px] text-gray-500">
                  <span>{session.messages.length} msgs</span>
                  <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <label className="block w-full cursor-pointer">
              <input 
                type="file" 
                multiple 
                accept=".txt,.md,.json,.csv,.pdf" 
                className="hidden" 
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <div className={`w-full border border-white/10 p-4 mb-4 flex flex-col items-center justify-center hover:bg-white/5 group rounded-lg transition-all ${isUploading ? 'opacity-50' : ''}`}>
                <Plus className="mb-2 group-hover:rotate-90 transition-transform text-gray-500" size={18} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Add Source</span>
              </div>
            </label>
            
            {isUploading && (
              <div className="mt-2 p-2 bg-blue-500/10 text-blue-400 text-[9px] truncate rounded border border-blue-500/20">
                {uploadStatus}
              </div>
            )}
            
            {files.length === 0 && (
              <div className="text-center mt-10 text-gray-600 text-xs opacity-60">
                No sources indexed
              </div>
            )}
            
            <div className="space-y-3">
              {files.map(file => (
                <div 
                  key={file.id}
                  onClick={() => onToggleFile(file.id, !(file.isEnabled !== false))}
                  className={`p-3 cursor-pointer transition-all rounded-lg ${
                    file.isEnabled !== false
                    ? 'sidebar-item bg-white/5 border-blue-500/30' 
                    : 'sidebar-item opacity-60 hover:opacity-100'
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
                          <rect x={30} y={20} width={50} height={50} stroke="white" strokeWidth={3} fill="none" />
                          <g transform="translate(0,-952.36222)">
                            <path 
                              d="m 56,963 c -102,122 6,9 7,9 17,-5 -66,69 -38,52 122,-77 -7,14 18,4 29,-11 45,-43 23,-4" 
                              stroke="white" 
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
                        <div className="font-semibold text-[10px] truncate uppercase max-w-[150px] text-white" title={file.name}>
                          {file.name}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(file.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[10px] text-red-500 hover:text-red-400 ml-2 px-1"
                        >
                          Del
                        </button>
                      </div>
                      <div className="text-[8px] mt-1 text-gray-600 font-semibold">
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

      <div className="h-20 p-4 border-t border-white/5 bg-black flex flex-col justify-center flex-shrink-0">
        <div className="flex justify-between items-center text-[9px] mb-2 font-semibold">
          <span className="text-gray-500">Context Usage</span>
          <span className={totalTokens > 30000 ? "text-red-500 font-bold" : "text-gray-500"}>
            {Math.round(totalTokens).toLocaleString()} / 1M
          </span>
        </div>
        <div className="w-full bg-white/5 h-2 border border-white/10 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-500 rounded-full" 
            style={{ width: `${Math.min((totalTokens / 1000000) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
