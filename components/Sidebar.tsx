import React, { useCallback, useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'chats' | 'sources'>('chats');
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
      className={`w-full border-r-2 border-black flex flex-col h-full bg-gray-50 flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}
      style={{ width: window.innerWidth >= 768 ? `${width}px` : '100vw', maxWidth: '100vw' }}
    >
      <div className="h-16 border-b-2 border-black bg-white flex items-center justify-center flex-shrink-0">
        {/* Tabs - Centered and responsive */}
        <div className="flex gap-1 border-2 border-black">
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-3 py-1 text-xs font-mono font-bold transition-all ${
              activeTab === 'chats'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            CHATS
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-3 py-1 text-xs font-mono font-bold transition-all ${
              activeTab === 'sources'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            SOURCES
          </button>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden absolute right-3 px-3 text-xl font-bold hover:bg-gray-100"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeTab === 'chats' ? (
          <>
            {/* New Chat Button */}
            <button
              onClick={onNewChat}
              className="w-full border-2 border-black p-3 text-center hover:bg-black hover:text-white transition-colors font-mono text-xs font-bold"
            >
              + NEW CHAT
            </button>
            
            {chatSessions.length === 0 && (
              <div className="text-center mt-10 text-gray-400 font-mono text-xs">
                NO CHAT HISTORY
              </div>
            )}
            
            {chatSessions.map(session => (
              <div 
                key={session.id}
                className={`group relative border p-3 bg-white transition-all cursor-pointer ${
                  currentChatId === session.id 
                    ? 'border-black border-2' 
                    : 'border-gray-300 hover:border-black'
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
              <div className={`w-full border-2 border-black border-dashed p-3 text-center hover:bg-gray-100 transition-colors ${isUploading ? 'opacity-50' : ''}`}>
                <span className="font-mono text-xs font-bold">
                  + ADD SOURCE
                </span>
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
            
            {files.map(file => (
              <div key={file.id} className="group relative border-2 border-gray-300 hover:border-black p-3 bg-white transition-all">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={file.isEnabled !== false}
                    onChange={(e) => onToggleFile(file.id, e.target.checked)}
                    className="mt-0.5 w-4 h-4 cursor-pointer accent-black flex-shrink-0"
                    title={file.isEnabled !== false ? "Enabled for RAG search" : "Disabled from RAG search"}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span 
                        className={`font-mono text-xs font-bold truncate max-w-[240px] ${file.isEnabled === false ? 'text-gray-400' : ''}`}
                        title={file.name}
                      >
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
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="h-[80px] p-4 border-t-2 border-black bg-white flex flex-col justify-center flex-shrink-0">
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
