import React, { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
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
      className={`w-full flex flex-col h-full bg-white flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}
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
      `}</style>

      <div className="flex border-b-2 border-black shrink-0 h-16 items-center px-4 gap-4 bg-white">
        {['CHATS', 'SOURCES'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase() as 'chats' | 'sources')}
            className={`flex-1 h-9 font-black text-[10px] uppercase transition-all duration-75 border-2 ${
              activeTab === tab.toLowerCase()
              ? 'bg-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px] text-black' 
              : 'bg-white border-gray-100 text-black'
            }`}
          >
            {tab}
          </button>
        ))}
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden absolute right-3 px-3 text-xl font-bold hover:bg-gray-100"
          >
            ×
          </button>
        )}
      </div>

      <div className="p-6 pr-4 flex-1 overflow-y-auto overflow-x-hidden">
        {activeTab === 'chats' ? (
          <>
            {/* New Chat Button */}
            <button
              onClick={onNewChat}
              className="w-full border-2 border-dashed border-black p-6 mb-6 flex flex-col items-center justify-center hover:bg-gray-50 group"
            >
              <Plus className="mb-2 group-hover:rotate-90 transition-transform" size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">+ New Chat</span>
            </button>
            
            {chatSessions.length === 0 && (
              <div className="text-center mt-10 text-gray-400 font-mono text-xs">
                NO CHAT HISTORY
              </div>
            )}
            
            {chatSessions.map(session => (
              <div 
                key={session.id}
                className={`group relative mb-3 border-2 p-4 bg-white transition-all cursor-pointer ${
                  currentChatId === session.id 
                    ? 'border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                    : 'border-transparent opacity-40 hover:opacity-100'
                }`}
                onClick={() => onSelectChat(session.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-xs font-bold truncate max-w-[200px]" title={session.title}>
                    {session.title}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-[10px] text-red-600 hover:underline font-mono ml-2"
                  >
                    DEL
                  </button>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                  <span>{session.messages.length} MSGS</span>
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
              <div className={`w-full border-2 border-dashed border-black p-6 mb-6 flex flex-col items-center justify-center hover:bg-gray-50 group ${isUploading ? 'opacity-50' : ''}`}>
                <Plus className="mb-2 group-hover:rotate-90 transition-transform" size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Add Source</span>
              </div>
            </label>
            
            {isUploading && (
              <div className="mt-2 p-1 bg-black text-white text-[10px] font-mono truncate">
                {uploadStatus}
              </div>
            )}
            
            {files.length === 0 && (
              <div className="text-center mt-10 text-gray-400 font-mono text-xs">
                NO SOURCES INDEXED
              </div>
            )}
            
            <div className="space-y-3">
              {files.map(file => (
                <div 
                  key={file.id}
                  onClick={() => onToggleFile(file.id, !(file.isEnabled !== false))}
                  className={`border-2 p-4 cursor-pointer transition-all ${
                    file.isEnabled !== false
                    ? 'border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                    : 'border-transparent opacity-40 hover:opacity-100'
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
                        <div className="font-bold text-[11px] truncate uppercase max-w-[200px]" title={file.name}>
                          {file.name}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(file.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[10px] text-red-600 hover:underline font-mono ml-2"
                        >
                          DEL
                        </button>
                      </div>
                      <div className="text-[9px] mt-1 text-gray-400 font-bold">
                        ~{Math.round(file.tokenCount || 0)} TOKENS
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="h-[88px] p-4 border-t-2 border-black bg-white flex flex-col justify-center flex-shrink-0">
        <div className="flex justify-between items-center font-mono text-[10px] mb-2">
          <span className="font-semibold">CONTEXT USAGE</span>
          <span className={totalTokens > 30000 ? "text-red-600 font-bold" : ""}>
            {Math.round(totalTokens).toLocaleString()} / 1M
          </span>
        </div>
        <div className="w-full bg-gray-200 h-2 border-2 border-black">
          <div 
            className="bg-black h-full transition-all duration-500" 
            style={{ width: `${Math.min((totalTokens / 1000000) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
