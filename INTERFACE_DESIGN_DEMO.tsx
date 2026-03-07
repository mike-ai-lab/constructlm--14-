/**
 * INTERFACE DESIGN DEMO
 * 
 * This is a standalone, simplified version of the ConstructLM interface
 * showing ONLY the design/layout structure without business logic.
 * 
 * Use this to:
 * - Experiment with layout changes
 * - Redesign the interface
 * - Test new visual concepts
 * - Understand the current design structure
 * 
 * Key Design Elements:
 * - Brutalist/minimalist aesthetic (black borders, monospace fonts)
 * - Two-column layout: Sidebar + Main chat area
 * - Responsive design (mobile/desktop)
 * - Canvas split-view for code preview
 */

import React, { useState } from 'react';
import { Send, Plus, Settings, BookOpen, Code, Download, Copy, Check, Play, Maximize2 } from 'lucide-react';

export const InterfaceDesignDemo: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'sources'>('sources');
  const [input, setInput] = useState('');

  return (
    <div className="flex h-screen bg-white text-black font-mono overflow-hidden">
      {/* ============================================
          SIDEBAR - Left Panel
          ============================================ */}
      <aside 
        className={`flex flex-col border-r-2 border-black bg-white transition-all duration-300 ${
          sidebarOpen ? 'w-80' : 'w-0'
        }`}
      >
        {/* Sidebar Header - Tabs */}
        <div className="flex border-b-2 border-black h-16 items-center px-4 gap-4 shrink-0">
          {['CHATS', 'SOURCES'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase() as 'chats' | 'sources')}
              className={`flex-1 h-9 font-black text-[10px] uppercase transition-all border-2 ${
                activeTab === tab.toLowerCase()
                  ? 'bg-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                  : 'bg-white border-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-6 pr-4 space-y-3">
          {activeTab === 'sources' ? (
            <>
              {/* Add Source Button */}
              <div className="w-full border-2 border-dashed border-black p-6 flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer group">
                <Plus className="mb-2 group-hover:rotate-90 transition-transform" size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Add Source</span>
              </div>

              {/* Source Items */}
              {[1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px] cursor-pointer hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <div className="flex items-start gap-3">
                    <input type="checkbox" defaultChecked className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[11px] uppercase truncate">
                        document_{i}.pdf
                      </div>
                      <div className="text-[9px] mt-1 text-gray-400 font-bold">
                        ~{2500 * i} TOKENS
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {/* New Chat Button */}
              <div className="w-full border-2 border-dashed border-black p-6 flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer group">
                <Plus className="mb-2 group-hover:rotate-90 transition-transform" size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">+ New Chat</span>
              </div>

              {/* Chat Items */}
              {[1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className={`border-2 p-4 bg-white transition-all cursor-pointer ${
                    i === 1
                      ? 'border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                      : 'border-transparent opacity-40 hover:opacity-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs font-bold truncate">
                      Chat about React hooks
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>12 MSGS</span>
                    <span>Mar 7</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Sidebar Footer - Context Usage */}
        <div className="h-[88px] p-4 border-t-2 border-black bg-white flex flex-col justify-center shrink-0">
          <div className="flex justify-between items-center font-mono text-[10px] mb-2">
            <span className="font-semibold">CONTEXT USAGE</span>
            <span>7,500 / 1M</span>
          </div>
          <div className="w-full bg-gray-200 h-2 border-2 border-black">
            <div className="bg-black h-full" style={{ width: '0.75%' }} />
          </div>
        </div>
      </aside>

      {/* ============================================
          MAIN CONTENT AREA
          ============================================ */}
      <main className={`flex-1 flex flex-col bg-white relative overflow-hidden transition-all duration-300 ${canvasOpen ? 'w-1/2' : 'w-full'}`}>
        
        {/* Desktop Header */}
        <header className="h-16 border-b-2 border-black flex items-center justify-between px-8 bg-white shrink-0">
          <div className="flex items-center gap-6">
            <BookOpen size={18} className="cursor-pointer hover:scale-110 transition-transform" />
            <Settings size={18} className="cursor-pointer hover:rotate-45 transition-transform" />
            <h1 className="text-lg font-black uppercase tracking-tighter">Construct_LM</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono">{3} FILES</span>
            <select className="text-[10px] font-mono font-bold px-2 py-1 border border-black bg-white">
              <option>CEREBRAS</option>
              <option>GEMINI</option>
              <option>GROQ</option>
            </select>
          </div>
        </header>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center">
          <div className="w-full max-w-3xl space-y-6">
            
            {/* Empty State */}
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 select-none py-20">
              <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="font-mono text-xs">AWAITING INPUT QUERY...</p>
            </div>

            {/* User Message Example */}
            <div className="flex flex-col items-end">
              <div className="mb-1 font-mono text-[10px] text-gray-400 uppercase">YOU</div>
              <div className="max-w-[70%] p-3.5 border-2 bg-black text-white border-black">
                <div className="leading-relaxed text-sm font-mono whitespace-pre-wrap">
                  How do I optimize React performance?
                </div>
              </div>
            </div>

            {/* AI Response Example */}
            <div className="flex flex-col items-start w-full">
              <div className="mb-1 font-mono text-[10px] text-gray-400 uppercase">CONSTRUCT_LM</div>
              <div className="w-full bg-white border-2 border-black p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="leading-relaxed text-sm font-mono">
                  <p className="mb-3">Here are key strategies for optimizing React performance:</p>
                  <ul className="list-disc list-inside mb-3 space-y-1">
                    <li>Use React.memo for component memoization</li>
                    <li>Implement useMemo and useCallback hooks</li>
                    <li>Code splitting with React.lazy</li>
                    <li>Virtual scrolling for large lists</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Code Block Example */}
            <div className="w-full">
              <div className="border-2 border-black p-4 my-4 flex items-center justify-between group hover:bg-gray-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="border-2 border-black p-2 bg-black text-white">
                    <Code size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-tight">React Component</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">tsx • Ready to render</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 border-2 border-black bg-white hover:bg-gray-100">
                    <Copy size={14} />
                  </button>
                  <button className="p-2 border-2 border-black bg-white hover:bg-gray-100">
                    <Download size={14} />
                  </button>
                  <button 
                    onClick={() => setCanvasOpen(!canvasOpen)}
                    className="border-2 border-black px-4 py-2 text-xs font-black uppercase bg-white hover:bg-black hover:text-white transition-all flex items-center gap-2"
                  >
                    Open Canvas <Play size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t-2 border-black p-6 bg-white shrink-0">
          <div className="max-w-3xl mx-auto">
            <form className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 p-3 border-2 border-black font-mono text-sm resize-none focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                rows={3}
              />
              <button className="px-6 py-3 border-2 border-black bg-black text-white font-black uppercase hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* ============================================
          CANVAS PANEL - Right Side (Code Preview)
          ============================================ */}
      {canvasOpen && (
        <div className="w-1/2 border-l-2 border-black flex flex-col bg-white">
          {/* Canvas Header */}
          <div className="h-16 border-b-2 border-black flex items-center justify-between px-6 bg-white shrink-0">
            <h2 className="font-black uppercase text-sm">Canvas Preview</h2>
            <button 
              onClick={() => setCanvasOpen(false)}
              className="text-2xl font-bold hover:bg-gray-100 px-2"
            >
              ×
            </button>
          </div>

          {/* Canvas Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Preview Area */}
            <div className="flex-1 bg-gray-50 border-b-2 border-black overflow-auto">
              <div className="p-6 flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <Maximize2 size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-mono">Component Preview</p>
                </div>
              </div>
            </div>

            {/* Code Editor Area */}
            <div className="h-48 border-t-2 border-black bg-white overflow-auto">
              <pre className="p-4 text-xs font-mono text-gray-700 whitespace-pre-wrap">
{`export default function Button() {
  return (
    <button className="px-4 py-2 border-2 border-black">
      Click me
    </button>
  );
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          GLOBAL STYLES
          ============================================ */}
      <style>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'JetBrains Mono', monospace;
          background: white;
          color: black;
        }

        /* Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        ::-webkit-scrollbar-track {
          background: #f0f0f0;
          border-left: 1px solid black;
        }
        ::-webkit-scrollbar-thumb {
          background: black;
          border-radius: 0px;
          border: 2px solid #f0f0f0;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #333;
        }

        /* Selection */
        ::selection {
          background-color: black;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default InterfaceDesignDemo;
