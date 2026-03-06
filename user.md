## the code:
```typescript
import React, { useRef } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { 
  Terminal,
  Box,
  ChevronRight,
  MousePointer2,
  Cpu,
  Zap,
  Shield,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";

const EXTENSIONS = [
  {
    id: "raytracer-pro",
    name: "Raytracer Pro",
    description: "High-fidelity light path simulation. Engineered for Riyadh's intense solar conditions in BIM models.",
    tagline: "LUMINESCENCE V4",
    accent: "#3b82f6",
    details: ["4K Sampling", "Real-time GI", "Solar Study"]
  },
  {
    id: "geometry-gen",
    name: "Geometry Gen",
    description: "Parametric facade generation. Transform complex algorithms into buildable architectural patterns.",
    tagline: "PARAMETRIC V1",
    accent: "#8b5cf6",
    details: ["Voronoi Sync", "BIM Mesh", "Auto-Label"]
  },
  {
    id: "material-sync",
    name: "Material Sync",
    description: "Cloud-based PBR library. Instant texture mapping for large-scale interior projects.",
    tagline: "PIPELINE V2",
    accent: "#10b981",
    details: ["PBR Maps", "Auto-UV", "10k Assets"]
  },
  {
    id: "studio-cloud",
    name: "Studiø Cloud",
    description: "Collaborative design vault. Secure your architectural IP and share assets across global teams.",
    tagline: "INFRASTRUCTURE",
    accent: "#f59e0b",
    details: ["AES-256", "Team Sync", "Versioning"]
  }
];

const Slide = ({ tool, index, progress }) => {
  // Staggered timing ranges for this specific slide
  // This ensures elements enter sequentially as the user scrolls
  const start = index * 0.25;
  const end = (index + 1) * 0.25;

  // Horizontal translation of the whole slide
  const x = useTransform(progress, [0, 1], ["0%", "-300%"]);
  
  // Nested staggered animations for elements within the slide
  const titleMove = useTransform(progress, [start, start + 0.1, start + 0.15], [200, 0, -50]);
  const descOpacity = useTransform(progress, [start + 0.05, start + 0.12, start + 0.18], [0, 1, 0]);
  const boxRotate = useTransform(progress, [start, end], [0, 360]);
  const boxScale = useTransform(progress, [start, start + 0.1, start + 0.2], [0.5, 1.2, 0.8]);

  return (
    <motion.div 
      style={{ x }}
      className="relative w-screen h-screen flex-shrink-0 flex items-center justify-center px-10 md:px-24"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full max-w-7xl items-center">
        
        {/* Left: Text Content (Staggered Entrance) */}
        <div className="lg:col-span-7 space-y-8">
          <motion.div style={{ x: titleMove }}>
             <span className="text-[10px] font-black tracking-[0.6em] text-white/20 uppercase">Module // 0{index + 1}</span>
             <h2 className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter leading-none mt-4">
               {tool.name.split(' ')[0]}<br/>
               <span style={{ color: tool.accent }}>{tool.name.split(' ')[1]}</span>
             </h2>
          </motion.div>

          <motion.p 
            style={{ opacity: descOpacity }}
            className="text-white/40 max-w-md text-lg italic font-medium"
          >
            {tool.description}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="flex flex-wrap gap-4"
          >
            {tool.details.map((d, i) => (
              <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest italic">
                {d}
              </div>
            ))}
          </motion.div>

          <div className="pt-10">
            <Link href={`/tools/${tool.id}`}>
              <Button className="bg-white text-black hover:bg-white/90 px-12 py-8 rounded-full font-black uppercase tracking-widest text-[10px] group shadow-2xl">
                Load Interface
                <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Right: Visual 3D Component (Nested Rotation/Scale) */}
        <div className="lg:col-span-5 relative flex justify-center items-center">
           <motion.div 
             style={{ rotate: boxRotate, scale: boxScale }}
             className="relative w-64 h-64 md:w-96 md:h-96"
           >
             <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent blur-3xl opacity-30"></div>
             <div className="relative h-full w-full bg-[#0c0c0e] border border-white/5 rounded-[60px] flex items-center justify-center shadow-2xl overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <svg width="100%" height="100%"><pattern id={`g-${index}`} width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5"/></pattern><rect width="100%" height="100%" fill={`url(#g-${index})`} /></svg>
                </div>
                <Box size={140} strokeWidth={1} style={{ color: tool.accent }} />
             </div>
           </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Tools() {
  const containerRef = useRef(null);
  
  // Driving the entire timeline with Vertical Scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 50, damping: 20 });

  return (
    <div className="bg-[#050505] text-white selection:bg-white selection:text-black">
      {/* HUD Elements */}
      <nav className="fixed top-0 w-full z-50 p-12 flex justify-between items-center pointer-events-none">
        <Link href="/" className="text-2xl font-black tracking-[0.3em] italic uppercase pointer-events-auto">Studiø</Link>
        <div className="pointer-events-auto bg-black/50 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full hidden md:flex gap-8 text-[9px] font-black uppercase tracking-[0.4em]">
          <Link href="/" className="text-white/40 hover:text-white transition-colors">System</Link>
          <span className="text-white">Inventory</span>
          <Link href="/contact" className="text-white/40 hover:text-white transition-colors">Access</Link>
        </div>
      </nav>

      {/* Progress Timeline Indicator */}
      <div className="fixed left-12 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-12">
        {EXTENSIONS.map((_, i) => {
           const active = useTransform(smoothProgress, [i*0.25, (i+1)*0.25], [1, 0.2]);
           return (
             <motion.div key={i} style={{ opacity: active }} className="flex items-center gap-4 group cursor-pointer">
               <div className="w-2 h-2 rounded-full bg-white"></div>
               <span className="text-[10px] font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">0{i+1}</span>
             </motion.div>
           );
        })}
      </div>

      {/* Main Scroll Container (Long Vertical Height) */}
      <div ref={containerRef} className="h-[400vh] relative">
        <div className="sticky top-0 h-screen w-full overflow-hidden flex">
          {EXTENSIONS.map((tool, index) => (
            <Slide key={tool.id} tool={tool} index={index} progress={smoothProgress} />
          ))}
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="fixed bottom-12 left-12 right-12 z-50 flex justify-between items-end pointer-events-none">
        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.4em] text-white/20">
          <Terminal size={14} /> Sequence Timeline Active
        </div>
        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 text-right">
          Muhamad Shkeir / Design Systems<br/>
          Riyadh, KSA
        </div>
      </div>
      
      {/* Scroll Guide */}
      <motion.div 
        style={{ opacity: useTransform(smoothProgress, [0, 0.05], [1, 0]) }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
      >
        <span className="text-[9px] font-black uppercase tracking-[0.6em] text-white/40">Scroll to Explore</span>
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"
        />
      </motion.div>
    </div>
  );
}
```

---

## The console in the devtools:

```
17:43:35.639 pdfParser.ts:17 PDF.js worker configured: https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs
17:43:35.846 installHook.js:1 In HTML, <div> cannot be a descendant of <p>.
This will cause a hydration error.

  ...
    <div className="flex flex-..." onTouchStart={function onTouchStart} onTouchMove={function onTouchMove} ...>
      <style>
      <header>
      <div className="flex flex-...">
        <aside>
        <div>
        <main className="flex-1 fle...">
          <header>
          <ChatInterface messages={[...]} onSendMessage={function handleSendMessage} isStreaming={false}>
            <div className="flex h-ful...">
              <div className="flex flex-...">
                <div className="flex-1 ove..." style={{...}}>
                  <div className="w-full max...">
                    <div>
                    <div className="w-full">
                      <div className="flex flex-...">
                        <div>
                        <div className="w-full bg-...">
                          <div className="leading-re...">
                            <Markdown remarkPlugins={[...]} components={{h1:function h1, ...}}>
                              <p>
                              <pre>
                              <p>
                              <ul>
                              <p node={{type:"element", ...}}>
>                               <p className="mb-3 last:mb-0 font-mono text-[13px] text-gray-800">
                                  <code node={{type:"element", ...}}>
                                    <div className="relative my-2">
>                                     <div className="absolute left-2 top-2 z-10">
                                      ...
                                  ...
                          ...
                  ...
                ...
        ...

overrideMethod @ installHook.js:1
17:43:35.848 installHook.js:1 <p> cannot contain a nested <div>.
See this log for the ancestor stack trace.
overrideMethod @ installHook.js:1
17:44:49.313 (index):64 cdn.tailwindcss.com should not be used in production. To use Tailwind CSS in production, install it as a PostCSS plugin or use the Tailwind CLI: https://tailwindcss.com/docs/installation
(anonymous) @ (index):64
17:44:49.320 createLucideIcon.ts:26 Uncaught TypeError: Cannot read properties of undefined (reading 'forwardRef')
17:44:49.527 about:srcdoc:236 Uncaught SyntaxError: Invalid or unexpected token
17:44:49.528 transformScriptTags.ts:271 You are using the in-browser Babel transformer. Be sure to precompile your scripts for production - https://babeljs.io/docs/setup/
(anonymous) @ transformScriptTags.ts:271
17:44:49.562 babel.min.js:3 Uncaught SyntaxError: /Inline Babel script: 'import' and 'export' may only appear at the top level. (10:0)

   8 |
   9 |
> 10 | import { 
     | ^
  11 |   Terminal,
  12 |   Box,
  13 |   ChevronRight,
```