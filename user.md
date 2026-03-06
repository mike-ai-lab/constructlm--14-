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
18:12:46.742 about:srcdoc:64 Uncaught SyntaxError: Invalid or unexpected token
18:12:46.746 unpkg.com/@babel/standalone/babel.min.js:3 You are using the in-browser Babel transformer. Be sure to precompile your scripts for production - https://babeljs.io/docs/setup/
(anonymous) @ unpkg.com/@babel/standalone/babel.min.js:3
VEe @ unpkg.com/@babel/standalone/babel.min.js:3
WEe @ unpkg.com/@babel/standalone/babel.min.js:3
18:12:49.701 about:srcdoc:64 Uncaught SyntaxError: Invalid or unexpected token (at about:srcdoc:64:131)
18:12:49.704 about:srcdoc:64 Uncaught SyntaxError: Invalid or unexpected token (at about:srcdoc:64:131)
18:12:49.705 babel.min.js:3 You are using the in-browser Babel transformer. Be sure to precompile your scripts for production - https://babeljs.io/docs/setup/
(anonymous) @ transformScriptTags.ts:271
VEe @ index.ts:277
WEe @ index.ts:261
18:12:49.810 babel.min.js:3 You are using the in-browser Babel transformer. Be sure to precompile your scripts for production - https://babeljs.io/docs/setup/
(anonymous) @ transformScriptTags.ts:271
VEe @ index.ts:277
WEe @ index.ts:261
18:12:51.555 react-dom.production.min.js:16  GET https://via.placeholder.com/400x200 net::ERR_NAME_NOT_RESOLVED
$d @ react-dom.production.min.js:16
xk @ react-dom.production.min.js:152
Qi @ react-dom.production.min.js:195
Ri @ react-dom.production.min.js:195
Ok @ react-dom.production.min.js:195
Nd @ react-dom.production.min.js:194
Ni @ react-dom.production.min.js:185
S @ react.production.min.js:17
U @ react.production.min.js:21
18:12:51.555 via.placeholder.com/400x200:1  Failed to load resource: net::ERR_NAME_NOT_RESOLVED
18:12:51.561 via.placeholder.com/400x200:1  GET https://via.placeholder.com/400x200 net::ERR_NAME_NOT_RESOLVED
Image
Ji @ react-dom.production.min.js:181
Hi @ react-dom.production.min.js:179
Hk @ react-dom.production.min.js:178
Rk @ react-dom.production.min.js:197
xb @ react-dom.production.min.js:196
Ni @ react-dom.production.min.js:187
S @ react.production.min.js:17
U @ react.production.min.js:21
18:12:51.561 via.placeholder.com/400x200:1  Failed to load resource: net::ERR_NAME_NOT_RESOLVED
18:13:01.367 about:srcdoc:64 Uncaught SyntaxError: Invalid or unexpected token (at about:srcdoc:64:131)
18:13:01.369 babel.min.js:3 You are using the in-browser Babel transformer. Be sure to precompile your scripts for production - https://babeljs.io/docs/setup/
(anonymous) @ transformScriptTags.ts:271
VEe @ index.ts:277
WEe @ index.ts:261
18:13:04.157 via.placeholder.com/400x200:1  GET https://via.placeholder.com/400x200 net::ERR_NAME_NOT_RESOLVED
Image
Ji @ react-dom.production.min.js:181
Hi @ react-dom.production.min.js:179
Hk @ react-dom.production.min.js:178
Rk @ react-dom.production.min.js:197
xb @ react-dom.production.min.js:196
Ni @ react-dom.production.min.js:187
S @ react.production.min.js:17
U @ react.production.min.js:21
18:13:09.651 about:srcdoc:64 Uncaught SyntaxError: Invalid or unexpected token (at about:srcdoc:64:131)
18:13:09.653 babel.min.js:3 You are using the in-browser Babel transformer. Be sure to precompile your scripts for production - https://babeljs.io/docs/setup/
(anonymous) @ transformScriptTags.ts:271
VEe @ index.ts:277
WEe @ index.ts:261
18:13:11.655 via.placeholder.com/400x200:1  GET https://via.placeholder.com/400x200 net::ERR_NAME_NOT_RESOLVED
Image
Ji @ react-dom.production.min.js:181
Hi @ react-dom.production.min.js:179
Hk @ react-dom.production.min.js:178
Rk @ react-dom.production.min.js:197
xb @ react-dom.production.min.js:196
Ni @ react-dom.production.min.js:187
S @ react.production.min.js:17
U @ react.production.min.js:21
18:13:17.153 about:srcdoc:242 Uncaught SyntaxError: Invalid or unexpected token (at about:srcdoc:242:35)
18:13:17.158 about:srcdoc:64 Uncaught SyntaxError: Invalid or unexpected token (at about:srcdoc:64:131)
18:13:17.159 transformScriptTags.ts:271 You are using the in-browser Babel transformer. Be sure to precompile your scripts for production - https://babeljs.io/docs/setup/
(anonymous) @ transformScriptTags.ts:271
VEe @ index.ts:277
WEe @ index.ts:261
18:13:17.212 parse-error.ts:95 Uncaught SyntaxError: /Inline Babel script: 'import' and 'export' may only appear at the top level. (9:0)

   7 |
   8 |
>  9 | import { 
     | ^
  10 |   Terminal,
  11 |   Box,
  12 |   ChevronRight,
e @ parse-error.ts:95
r.raise @ index.ts:1504
r.parseStatementContent @ statement.ts:640
r.parseStatementLike @ statement.ts:482
r.parseStatementLike @ index.ts:1991
r.parseStatementListItem @ statement.ts:431
r.parseBlockOrModuleBlockBody @ statement.ts:1444
r.parseBlockBody @ statement.ts:1417
r.parseBlock @ statement.ts:1385
r.parseTryStatement @ statement.ts:1205
r.parseStatementContent @ statement.ts:549
r.parseStatementLike @ statement.ts:482
r.parseStatementLike @ index.ts:1991
r.parseModuleItem @ statement.ts:419
r.parseBlockOrModuleBlockBody @ statement.ts:1443
r.parseBlockBody @ statement.ts:1417
r.parseProgram @ statement.ts:229
r.parseTopLevel @ statement.ts:203
r.parseTopLevel @ index.ts:3372
r.parse @ index.ts:83
aR @ index.ts:86
(anonymous) @ index.ts:29
(anonymous) @ babel.min.js:3
(anonymous) @ babel.min.js:3
(anonymous) @ babel.min.js:3
(anonymous) @ babel.min.js:3
(anonymous) @ babel.min.js:3
(anonymous) @ babel.min.js:3
(anonymous) @ babel.min.js:3
(anonymous) @ babel.min.js:3
iF @ index.js:251
sync @ index.js:89
stopHiding - secret - don't use this - v1 @ rewrite-stack-trace.ts:99
SV @ transform.ts:66
FEe @ index.ts:179
(anonymous) @ transformScriptTags.ts:53
SEe @ transformScriptTags.ts:120
n @ transformScriptTags.ts:193
PEe @ transformScriptTags.ts:240
(anonymous) @ transformScriptTags.ts:276
VEe @ index.ts:277
WEe @ index.ts:261
18:13:17.216 transformScriptTags.ts:271 You are using the in-browser Babel transformer. Be sure to precompile your scripts for production - https://babeljs.io/docs/setup/
(anonymous) @ transformScriptTags.ts:271
VEe @ index.ts:277
WEe @ index.ts:261
18:13:18.606 via.placeholder.com/400x200:1  GET https://via.placeholder.com/400x200 net::ERR_NAME_NOT_RESOLVED
Image
Ji @ react-dom.production.min.js:181
Hi @ react-dom.production.min.js:179
Hk @ react-dom.production.min.js:178
Rk @ react-dom.production.min.js:197
xb @ react-dom.production.min.js:196
Ni @ react-dom.production.min.js:187
S @ react.production.min.js:17
U @ react.production.min.js:21

```