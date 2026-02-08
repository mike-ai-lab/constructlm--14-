import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Settings, 
  Send, 
  X,
  ExternalLink,
  Copy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const App = () => {
  const [selectedSources, setSelectedSources] = useState(['construction_manual.pdf']);
  const [activeModel, setActiveModel] = useState('GEMINI');
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [hoveredCitation, setHoveredCitation] = useState(null);
  const [activeTab, setActiveTab] = useState('SOURCES');
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const isResizing = useRef(false);
  const modalRef = useRef(null);

  // Transition constant to ensure perfect synchronization
  const transitionStyle = "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]";

  const sources = [
    { name: 'technical_spec.txt', type: 'PLAIN', tokens: '~341' },
    { name: 'meeting_notes.txt', type: 'PLAIN', tokens: '~453' },
    { name: 'construction_manual.pdf', type: 'PDF', tokens: '~1599' },
    { name: 'research_paper.txt', type: 'PLAIN', tokens: '~518' },
    { name: 'reportdata.md', type: 'FILE', tokens: '~3137' },
  ];

  const startResizing = (e) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX;
    if (newWidth > 200 && newWidth < 600) {
      setSidebarWidth(newWidth);
    }
  };

  const toggleSource = (name) => {
    setSelectedSources(prev => 
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  return (
    <div className="flex h-screen w-full bg-[#f5f5f5] text-[#1a1a1a] font-mono selection:bg-black selection:text-white overflow-hidden relative">
      <style>{`
        /* Custom Scrollbar Styling */
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
      
      {/* CITATION MODAL */}
      {selectedCitation && (
        <div 
          className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 md:p-16"
          onClick={() => setSelectedCitation(null)}
        >
          <div 
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-2 border-black w-full max-w-4xl shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-150"
          >
            <div className="border-b-2 border-black p-4 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-black" />
                <span className="font-black text-[11px] uppercase tracking-[0.2em]">SRC_REF_{selectedCitation}</span>
                <span className="text-gray-300">|</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">construction_manual.pdf</span>
              </div>
              <button onClick={() => setSelectedCitation(null)} className="hover:bg-black hover:text-white p-1 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-16 border-r-2 border-black bg-white flex flex-col items-center py-8 gap-12 shrink-0">
                <div className="bg-black py-4 px-1.5 flex items-center justify-center">
                  <div className="[writing-mode:vertical-lr] rotate-180 text-[11px] font-black tracking-[0.4em] text-white uppercase">
                    PAGE_042
                  </div>
                </div>
                <div className="bg-black py-4 px-1.5 flex items-center justify-center">
                  <div className="[writing-mode:vertical-lr] rotate-180 text-[11px] font-black tracking-[0.4em] text-white uppercase">
                    SEC_SBC-202
                  </div>
                </div>
              </div>

              <div className="flex-1 p-8 md:p-12 overflow-y-auto relative bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:24px_24px]">
                <div className="relative max-w-4xl">
                  <p className="text-[13px] md:text-[14px] leading-[1.8] text-gray-800 font-medium tracking-tight bg-white/60 p-2 border-l-2 border-black/10">
                    "...plumbing standards for residential zones in high-heat environments 
                    (Reference: Saudi Building Code 202). All piping must be insulated..."
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-black grid grid-cols-2 bg-white shrink-0">
              <button className="py-5 font-black text-[13px] uppercase tracking-[0.15em] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-3 border-r-2 border-black">
                <ExternalLink size={18} /> OPEN_FILE
              </button>
              <button className="py-5 font-black text-[13px] uppercase tracking-[0.15em] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-3">
                <Copy size={18} /> COPY_SNIPPET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside 
        style={{ width: isSidebarOpen ? sidebarWidth : 0 }}
        className={`relative bg-white shrink-0 z-30 flex flex-col border-r-2 border-black ${transitionStyle}`}
      >
        <div 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute -right-[26px] top-0 w-6 h-full border-r-2 border-black bg-[#f0f0f0] cursor-pointer group hover:bg-[#e0e0e0] z-50 flex flex-col items-center ${transitionStyle}`}
        >
          <div className={`mt-8 [writing-mode:vertical-lr] text-[8px] font-black tracking-[0.3em] uppercase opacity-30 group-hover:opacity-100 transition-opacity ${transitionStyle}`}>
            {isSidebarOpen ? 'COLLAPSE' : 'EXPAND'}
          </div>

          <div className="absolute top-1/2 -translate-y-1/2 w-full flex flex-col items-center gap-1">
            <div className="w-1 h-8 bg-black/10 group-hover:bg-black/20" />
            <div className={`w-full h-12 bg-black flex items-center justify-center text-white shadow-[2px_0_10px_rgba(0,0,0,0.1)] transition-transform group-hover:scale-x-110`}>
              {isSidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
            </div>
            <div className="w-1 h-8 bg-black/10 group-hover:bg-black/20" />
          </div>

          <div className="absolute bottom-8 [writing-mode:vertical-lr] text-[7px] font-bold tracking-widest text-black/20">
            SYSTEM_RAIL_V1
          </div>
        </div>

        <div 
          style={{ 
            width: sidebarWidth, 
            transform: isSidebarOpen ? 'translateX(0)' : `translateX(-${sidebarWidth}px)`,
          }}
          className={`h-full flex flex-col overflow-hidden ${transitionStyle} ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="flex border-b-2 border-black shrink-0 h-16 items-center px-4 gap-4 bg-white">
            {['CHATS', 'SOURCES'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 h-9 font-black text-[10px] uppercase transition-all duration-75 border-2 ${
                  activeTab === tab 
                  ? 'bg-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px] text-black' 
                  : 'bg-white border-gray-100 text-black'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 pr-4 flex-1 overflow-y-auto overflow-x-hidden">
            <button className="w-full border-2 border-dashed border-black p-6 mb-6 flex flex-col items-center justify-center hover:bg-gray-50 group">
              <Plus className="mb-2 group-hover:rotate-90 transition-transform" size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Add Source</span>
            </button>
            <div className="space-y-3">
              {sources.map((source) => (
                <div 
                  key={source.name}
                  onClick={() => toggleSource(source.name)}
                  className={`border-2 p-4 cursor-pointer transition-all ${
                    selectedSources.includes(source.name) 
                    ? 'border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                    : 'border-transparent opacity-40 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="checkbox-wrapper shrink-0">
                      <input 
                        type="checkbox" 
                        className="check" 
                        id={`check-${source.name}`}
                        checked={selectedSources.includes(source.name)}
                        onChange={() => {}} 
                      />
                      <label htmlFor={`check-${source.name}`} className="label">
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
                      <div className="font-bold text-[11px] truncate uppercase">{source.name}</div>
                      <div className="text-[9px] mt-1 text-gray-400 font-bold">{source.tokens} TOKENS</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isSidebarOpen && (
          <div 
            onMouseDown={startResizing}
            className="absolute top-0 right-[-2px] w-2 h-full cursor-col-resize z-[60] active:bg-black/10 hover:bg-black/5"
          />
        )}
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col relative bg-[#f9f9f9] min-w-0 ml-6">
        <header className="h-16 border-b-2 border-black flex items-center justify-between px-8 bg-white shrink-0">
          <div className="flex items-center gap-6">
            <Settings size={18} className="cursor-pointer hover:rotate-45 transition-transform" />
            <h1 className="text-lg font-black uppercase tracking-tighter">Construct_LM</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {['GEMINI', 'CEREBRAS'].map(m => (
                <button 
                  key={m}
                  onClick={() => setActiveModel(m)}
                  className={`h-9 px-4 text-[10px] font-black uppercase transition-all duration-75 border-2 ${
                    activeModel === m 
                    ? 'bg-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px] text-black' 
                    : 'bg-white border-gray-100 text-black'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center">
          <div className="w-full max-w-3xl">
            <div className="bg-white border-2 border-black p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="space-y-6 text-[13px] text-gray-800 leading-relaxed">
                <p className="bg-[#fff3b0] p-2 inline-block border-l-2 border-black font-bold uppercase text-[10px] tracking-wider">
                  Reference: construction_manual.pdf | Saudi Building Code 202
                </p>
                <p>
                  According to the latest technical specifications, the thermal insulation of pipes is mandatory for all projects 
                  located in the Central Region (Riyadh) to prevent heat-induced expansion.
                </p>
                <p>
                  Contractors must ensure that insulation materials meet the ASTM C547 standard for mineral fiber pipe insulation.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-12 pt-8 border-t-2 border-black">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="relative">
                    <div 
                      onMouseEnter={() => setHoveredCitation(i)}
                      onMouseLeave={() => setHoveredCitation(null)}
                      onClick={() => setSelectedCitation(i)}
                      className="bg-white border-2 border-gray-100 p-2.5 flex items-center gap-3 cursor-pointer hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      <div className="w-1.5 h-1.5 bg-black" />
                      <span className="text-[9px] font-bold uppercase text-gray-500 truncate">SRC {i}: manual.pdf</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="h-[90px] border-t-2 border-black bg-white shrink-0 flex items-center justify-center px-6">
          <div className="w-full max-w-3xl relative">
            <div className={`relative transition-all duration-100 ${isInputFocused ? 'translate-x-[-2px] translate-y-[-2px]' : ''}`}>
              <input 
                type="text" 
                placeholder="ASK A QUESTION..."
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                className={`w-full border-2 border-black p-3 text-[11px] font-bold focus:outline-none uppercase placeholder:text-gray-300 bg-white transition-all duration-100 ${
                  isInputFocused ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''
                }`}
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white p-2 hover:bg-gray-800 transition-colors">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;