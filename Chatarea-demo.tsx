import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  ChevronRight, 
  RotateCcw, 
  Code2, 
  Play, 
  X, 
  ThumbsUp, 
  ThumbsDown, 
  MoreVertical,
  Maximize2,
  Paperclip,
  Sparkles,
  Zap,
  Mic,
  Layout,
  Square,
  Copy,
  Download,
  Settings,
  BookOpen,
  User,
  ArrowRight
} from 'lucide-react';

const App = () => {
  const [isCanvasOpen, setIsCanvasOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('preview');

  return (
    <div className="flex flex-col h-screen w-full bg-white text-black font-mono selection:bg-black selection:text-white overflow-hidden">
      
      {/* TOP NAVIGATION BAR */}
      <header className="h-14 border-b-2 border-black flex items-center justify-between px-6 shrink-0 z-20 bg-white">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer">
            <BookOpen size={20} strokeWidth={2.5} />
            <Settings size={20} strokeWidth={2.5} />
            <h1 className="text-xl font-black tracking-tighter ml-2 uppercase">CONSTRUCT_LM</h1>
          </div>
          <div className="hidden md:flex border-2 border-black px-3 py-1 text-xs font-bold uppercase items-center gap-2">
            GPT-OSS-128B <ChevronRight size={14} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 text-xs font-bold uppercase border-2 border-transparent hover:border-black transition-all">Gemini</button>
          <button className="px-4 py-1.5 text-xs font-bold uppercase border-2 border-black bg-white hover:bg-black hover:text-white transition-all">Cerebras</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT SIDE: AI Chat Area */}
        {/* Fixed: Removed mx-auto and added origin-left to ensure expansion happens from the left side only */}
        <div 
          className={`flex flex-col border-black overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] origin-left ${
            isCanvasOpen ? 'w-[45%] border-r-2' : 'w-full border-r-0'
          }`}
        >
          {/* Scrollable Chat Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* USER MESSAGE */}
            <div className={`flex justify-end animate-in fade-in slide-in-from-right-4 duration-500 ${!isCanvasOpen ? 'max-w-5xl' : ''}`}>
              <div className="max-w-[85%] p-4 border-2 border-black bg-gray-50 flex gap-4 items-start shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="border-2 border-black p-1 bg-white">
                    <User size={16} />
                </div>
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest mb-1">Muhamad</div>
                    <p className="text-sm font-bold">create a react component for a login page</p>
                </div>
              </div>
            </div>

            {/* AI RESPONSE */}
            <div className={`p-6 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden animate-in fade-in slide-in-from-left-4 duration-700 ${!isCanvasOpen ? 'max-w-5xl' : ''}`}>
              <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Sparkles size={40} />
              </div>
              <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-black rotate-45"></div>
                  <span className="text-xs font-black uppercase tracking-widest">System Response</span>
              </div>
              <p className="text-sm leading-relaxed mb-4 relative z-10">
                The component is completely self-contained—no additional files are required beyond the usual Tailwind setup. It renders a clean, responsive login UI that works in both light and dark modes. Feel free to replace the placeholder authentication logic with your own API call.
              </p>
              <div className="flex gap-4 text-[10px] text-gray-400 font-bold uppercase">
                <span>Input: 39 tokens</span>
                <span>Output: 1575 tokens</span>
              </div>
            </div>

            {/* CANVAS CLOSED STATE CARD */}
            {!isCanvasOpen && (
              <div className="border-2 border-black p-5 flex items-center justify-between group hover:bg-gray-50 transition-all animate-in zoom-in-95 duration-300 max-w-5xl">
                <div className="flex items-center gap-4">
                  <div className="border-2 border-black p-2 bg-black text-white">
                    <Layout size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight">Modern Login UI</h4>
                    <p className="text-[10px] text-gray-500 font-bold">TSX COMPONENT • V1.0</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCanvasOpen(true)}
                  className="border-2 border-black px-6 py-2 text-xs font-black uppercase bg-white hover:bg-black hover:text-white transition-all flex items-center gap-2"
                >
                  Open Canvas <Play size={12} fill="currentColor" />
                </button>
              </div>
            )}

            {/* Instruction Steps */}
            <div className={`space-y-8 ${!isCanvasOpen ? 'max-w-5xl' : ''}`}>
              <div>
                <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                  <span className="bg-black text-white px-2 py-0.5 text-sm italic">01.</span> Setup
                </h3>
                <div className="border-2 border-black p-4 bg-gray-50 font-mono text-xs relative group">
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy size={14} className="cursor-pointer hover:text-black" />
                    <Download size={14} className="cursor-pointer hover:text-black" />
                  </div>
                  <code>@tailwind base;<br/>@tailwind components;<br/>@tailwind utilities;</code>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                  <span className="bg-black text-white px-2 py-0.5 text-sm italic">02.</span> Implementation
                </h3>
                <p className="text-sm mb-4">Add the component to any page by importing the default export.</p>
                <div className="border-2 border-black p-6 bg-gray-50 font-mono text-xs">
                  <div className="flex justify-between mb-4 border-b border-black pb-2">
                    <span className="bg-black text-white px-2 py-0.5 text-[10px] font-bold">TSX</span>
                    <button className="hover:underline font-bold uppercase text-[10px]">Preview</button>
                  </div>
                  <code>import LoginForm from "./LoginForm";<br/><br/>function App() &#123;<br/>&nbsp;&nbsp;return &lt;LoginForm /&gt;;<br/>&#125;</code>
                </div>
              </div>
            </div>
          </div>

          {/* CHAT INPUT AREA */}
          <div className="p-6 border-t-2 border-black bg-white shrink-0">
            <div className={`relative ${!isCanvasOpen ? 'max-w-5xl' : ''}`}>
              <input 
                type="text" 
                placeholder="ASK A QUESTION..." 
                className="w-full border-2 border-black py-4 px-6 pr-24 text-xs font-black uppercase placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-black/5"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-3 text-black items-center">
                <Paperclip size={18} className="cursor-pointer hover:scale-110 transition-transform hidden sm:block" />
                <Mic size={18} className="cursor-pointer hover:scale-110 transition-transform hidden sm:block" />
                <button className="bg-black text-white p-2">
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Canvas Rendering */}
        <div 
          className={`bg-[#f9f9f9] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col absolute top-0 bottom-0 right-0 z-10 ${
            isCanvasOpen ? 'w-[55%] opacity-100 translate-x-0 border-l-2 border-black' : 'w-0 opacity-0 translate-x-full pointer-events-none'
          }`}
        >
          {isCanvasOpen && (
            <div className="flex flex-col h-full p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-6 shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="flex items-center gap-3 bg-black text-white px-4 py-2 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                       <Square size={12} fill="white" />
                       Canvas <span className="text-gray-400 font-normal">v1/3</span>
                     </div>
                  </div>

                  <div className="flex items-center gap-1 border-2 border-black bg-white p-1">
                     <button 
                       onClick={() => setActiveTab('code')}
                       className={`px-4 py-1 text-[10px] font-black uppercase transition-all ${activeTab === 'code' ? 'bg-black text-white' : 'text-black hover:bg-gray-100'}`}
                     >
                       &lt;&gt; Code
                     </button>
                     <button 
                       onClick={() => setActiveTab('preview')}
                       className={`px-4 py-1 text-[10px] font-black uppercase transition-all ${activeTab === 'preview' ? 'bg-black text-white' : 'text-black hover:bg-gray-100'}`}
                     >
                       Preview
                     </button>
                  </div>

                  <div className="flex items-center gap-1">
                     <button className="p-2 border-2 border-black bg-white hover:bg-gray-100" title="Reset"><RotateCcw size={16} /></button>
                     <button className="p-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-all ml-2 uppercase text-[10px] font-black px-4">Update</button>
                     <button 
                        onClick={() => setIsCanvasOpen(false)}
                        className="p-2 border-2 border-black bg-white hover:bg-red-500 hover:text-white transition-all ml-2"
                      >
                        <X size={16} />
                      </button>
                  </div>
              </div>

              <div className="flex-1 bg-white border-2 border-black overflow-hidden flex items-center justify-center p-8 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-full max-w-sm space-y-8">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-black rounded-none mb-6">
                      <Lock className="text-white w-5 h-5" />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Welcome Back</h1>
                    <p className="mt-2 text-gray-500 text-xs font-bold leading-tight uppercase">
                      Muhamad, please enter your details.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                      <input type="email" placeholder="name@company.com" className="w-full bg-white border-2 border-black rounded-none py-3 px-4 text-xs font-bold focus:outline-none focus:bg-gray-50 transition-all placeholder:text-gray-300" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Password</label>
                      <input type="password" defaultValue="password123" className="w-full bg-white border-2 border-black rounded-none py-3 px-4 text-xs font-bold focus:outline-none focus:bg-gray-50 transition-all" />
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 border-2 border-black rounded-none appearance-none checked:bg-black transition-all cursor-pointer" />
                        <span className="text-[10px] font-bold uppercase">Remember</span>
                      </label>
                      <button className="text-[10px] font-black uppercase border-b-2 border-black hover:bg-black hover:text-white px-1">Forgot?</button>
                    </div>
                    <button className="w-full bg-black text-white font-black py-4 uppercase text-xs tracking-widest hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-1 active:translate-y-1">Sign In</button>
                  </div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-4 border-l-2 border-black bg-white">
                  <div className="w-full h-1/4 bg-black mt-20"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;