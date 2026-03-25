import React, { useState } from 'react';
import { Check, X, FileCode, RotateCcw } from 'lucide-react';

/**
 * App Component
 * A clean VS Code-style editor showing multiple interactive diffs.
 * Confirmed changes remove all diff UI elements to show the "fixed" code.
 */
export default function App() {
  // Tracking status for 3 separate code fixes
  const [diffs, setDiffs] = useState({
    imports: 'pending', // Fix 1: Typo in import
    gradient: 'pending', // Fix 2: Gradient color update
    logic: 'pending'    // Fix 3: Button logic fix
  });

  const updateDiff = (key, status) => {
    setDiffs(prev => ({ ...prev, [key]: status }));
  };

  const resetAll = () => {
    setDiffs({ imports: 'pending', gradient: 'pending', logic: 'pending' });
  };

  // Helper to determine if a specific diff section should still show the header/markers
  const isPending = (key) => diffs[key] === 'pending';

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans p-4 flex flex-col items-center">
      <div className="w-full max-w-5xl bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden shadow-2xl">
        
        {/* Tab Bar */}
        <div className="flex items-center justify-between bg-[#010409] px-4 py-2 border-b border-[#30363d]">
          <div className="flex items-center gap-2 text-xs text-[#8b949e]">
            <FileCode size={14} className="text-[#7ee787]" />
            <span className="border-b border-[#f78166] pb-1">App.jsx</span>
          </div>
          <button onClick={resetAll} className="text-[10px] text-[#8b949e] hover:text-white flex items-center gap-1 uppercase tracking-tighter">
            <RotateCcw size={12} /> Reset Diffs
          </button>
        </div>

        {/* Editor Body */}
        <div className="font-mono text-[13px] leading-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {/* --- SECTION 1: IMPORTS --- */}
              <Line n={1} c={<><span className="text-[#ff7b72]">import</span> React, {'{ useState }'} <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">'react'</span>;</>} />
              
              {isPending('imports') && <DiffHeader title="CRITICAL: Fix Import Typo" />}
              <DiffRow 
                status={diffs.imports}
                type="old"
                n="-"
                content={<><span className="text-[#ff7b72]">import</span> {'{ HeartIcon }'} <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">'lucide-reac'</span>; <span className="text-[#8b949e]">// Error: missing 't'</span></>}
              />
              <DiffRow 
                status={diffs.imports}
                type="new"
                n={diffs.imports === 'accepted' ? 2 : '+'}
                content={<><span className="text-[#ff7b72]">import</span> {'{ Heart }'} <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">'lucide-react'</span>;</>}
                onAccept={() => updateDiff('imports', 'accepted')}
                onReject={() => updateDiff('imports', 'rejected')}
              />

              <Line n={3} c="" />
              <Line n={4} c={<><span className="text-[#ff7b72]">export default function</span> <span className="text-[#d2a8ff]">App</span>() {'{'}</>} />
              <Line n={5} c={<>&nbsp;&nbsp;<span className="text-[#ff7b72]">const</span> [liked, setLiked] = <span className="text-[#d2a8ff]">useState</span>(<span className="text-[#79c0ff]">false</span>);</>} />
              <Line n={6} c="" />
              <Line n={7} c={<>&nbsp;&nbsp;<span className="text-[#ff7b72]">return</span> (</>} />

              {/* --- SECTION 2: STYLING --- */}
              <Line n={8} c={<>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#7ee787]">&lt;div</span></>} />
              
              {isPending('gradient') && <DiffHeader title="UI UPDATE: Refine Brand Colors" />}
              <DiffRow 
                status={diffs.gradient}
                type="old"
                n="-"
                content={<>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#79c0ff]">className</span>=<span className="text-[#a5d6ff]">"bg-gray-100 min-h-screen"</span></>}
              />
              <DiffRow 
                status={diffs.gradient}
                type="new"
                n={diffs.gradient === 'accepted' ? 9 : '+'}
                content={<>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#79c0ff]">className</span>=<span className="text-[#a5d6ff]">"bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen"</span></>}
                onAccept={() => updateDiff('gradient', 'accepted')}
                onReject={() => updateDiff('gradient', 'rejected')}
              />

              <Line n={10} c={<>&nbsp;&nbsp;&nbsp;&nbsp;&gt;</>} />
              <Line n={11} c={<>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#7ee787]">&lt;h1</span> <span className="text-[#79c0ff]">className</span>=<span className="text-[#a5d6ff]">"text-4xl font-bold mb-8"</span><span className="text-[#7ee787]">&gt;</span>Icons Work!<span className="text-[#7ee787]">&lt;/h1&gt;</span></>} />
              
              {/* Middle filler lines */}
              {[...Array(8)].map((_, i) => (
                <Line key={i} n={12 + i} c={<>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#8b949e]">// Rendering component content...</span></>} />
              ))}

              {/* --- SECTION 3: BUTTON LOGIC --- */}
              <Line n={20} c={<>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#7ee787]">&lt;button</span></>} />
              
              {isPending('logic') && <DiffHeader title="LOGIC FIX: Toggle Functionality" />}
              <DiffRow 
                status={diffs.logic}
                type="old"
                n="-"
                content={<>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#79c0ff]">onClick</span>={'{() => '} <span className="text-[#d2a8ff]">console</span>.<span className="text-[#d2a8ff]">log</span>(<span className="text-[#a5d6ff]">'clicked'</span>){'}'}</>}
              />
              <DiffRow 
                status={diffs.logic}
                type="new"
                n={diffs.logic === 'accepted' ? 21 : '+'}
                content={<>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#79c0ff]">onClick</span>={'{() => '} <span className="text-[#d2a8ff]">setLiked</span>(!liked){'}'}</>}
                onAccept={() => updateDiff('logic', 'accepted')}
                onReject={() => updateDiff('logic', 'rejected')}
              />

              <Line n={22} c={<>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#79c0ff]">className</span>=<span className="text-[#a5d6ff]">"px-6 py-3 bg-red-500 rounded-lg text-white"</span></>} />
              <Line n={23} c={<>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#7ee787]">&gt;</span></>} />
              <Line n={24} c={<>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#7ee787]">&lt;Heart</span> <span className="text-[#79c0ff]">fill</span>={'{liked ? '} <span className="text-[#a5d6ff]">'currentColor'</span> : <span className="text-[#a5d6ff]">'none'</span> {'}'} <span className="text-[#7ee787]">/&gt;</span></>} />
              <Line n={25} c={<>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{'{liked ? '} <span className="text-[#a5d6ff]">'Liked!'</span> : <span className="text-[#a5d6ff]">'Like'</span> {'}'}</>} />
              <Line n={26} c={<>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#7ee787]">&lt;/button&gt;</span></>} />
              <Line n={27} c={<>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#7ee787]">&lt;/div&gt;</span></>} />
              <Line n={28} c={<>&nbsp;&nbsp;);</>} />
              <Line n={29} c={'}'} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Standard line with syntax highlighting
 */
function Line({ n, c }) {
  return (
    <tr className="hover:bg-[#1f242c] group">
      <td className="w-12 text-right pr-4 text-[#484f58] select-none border-r border-[#30363d] bg-[#161b22]">{n}</td>
      <td className="pl-4 whitespace-pre">{c}</td>
    </tr>
  );
}

/**
 * Header shown only during pending diff
 */
function DiffHeader({ title }) {
  return (
    <tr>
      <td colSpan="2" className="bg-[#0d1117] px-4 py-1 text-[10px] text-blue-400 uppercase tracking-widest font-bold border-y border-[#30363d]/50">
        {title}
      </td>
    </tr>
  );
}

/**
 * Interactive Diff Row
 */
function DiffRow({ status, type, n, content, onAccept, onReject }) {
  const isPending = status === 'pending';
  
  // If accepted, only show 'new' row without decorations
  if (status === 'accepted' && type === 'old') return null;
  // If rejected, only show 'old' row without decorations (opacity lowered to show it was kept)
  if (status === 'rejected' && type === 'new') return null;

  const bgClass = isPending 
    ? (type === 'old' ? 'bg-[#442326]' : 'bg-[#234431]') 
    : 'bg-transparent';

  const textClass = isPending
    ? (type === 'old' ? 'text-[#ffa198]' : 'text-[#aff5b4]')
    : '';

  return (
    <tr className={`${bgClass} border-b border-[#30363d]/10`}>
      <td className={`w-12 text-right pr-4 select-none border-r border-[#30363d] ${isPending ? 'bg-[#161b22]' : 'text-[#484f58]'}`}>
        {n}
      </td>
      <td className={`pl-4 flex items-center justify-between whitespace-pre ${textClass}`}>
        <span>{content}</span>
        
        {isPending && type === 'new' && (
          <div className="flex gap-1 mr-4 bg-[#0d1117] p-0.5 rounded border border-[#30363d]">
            <button onClick={onAccept} className="p-1 hover:bg-green-900/50 text-green-500 rounded"><Check size={14} /></button>
            <button onClick={onReject} className="p-1 hover:bg-red-900/50 text-red-500 rounded"><X size={14} /></button>
          </div>
        )}
      </td>
    </tr>
  );
}