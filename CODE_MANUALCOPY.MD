import React, { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bookmark, 
  ArrowRight, 
  Cpu, 
  Layers, 
  Zap, 
  Shield, 
  Maximize, 
  Activity,
  Terminal,
  Box
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Local Badge component to prevent ReferenceError if the UI library import fails
const Badge = ({ children, className, variant = "outline" }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
    {children}
  </span>
);

// Mocked extensions for standalone preview
const EXTENSIONS_MOCK = {
  "raytracer-pro": {
    name: "Raytracer Pro",
    description: "Real-time physics-based light simulation for complex architectural environments.",
    tagline: "LUMINESCENCE ENGINE V4",
    features: ["Global Illumination", "Caustic Mapping", "Adaptive Sampling"],
    version: "4.2.0",
    complexity: "Advanced"
  },
  "geometry-gen": {
    name: "Geometry Gen",
    description: "Algorithmic structural generation for parametric facade and landscape design.",
    tagline: "PARAMETRIC ARCHITECT V1",
    features: ["Voronoi Patterns", "Surface Optimization", "BIM Export"],
    version: "1.0.8",
    complexity: "Expert"
  },
  "material-sync": {
    name: "Material Sync",
    description: "Universal PBR material library with automated texture mapping for SketchUp.",
    tagline: "TEXTURE PIPELINE V2",
    features: ["PBR Workflows", "Auto-Mapping", "Cloud Library"],
    version: "2.1.5",
    complexity: "Intermediate"
  }
};

const ToolCard = ({ id, tool, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-[40px] opacity-0 group-hover:opacity-10 transition duration-500 blur-xl"></div>
      
      <div className="relative bg-[#0c0c0e] border border-white/5 rounded-[40px] overflow-hidden flex flex-col md:flex-row h-full">
        {/* Visual Identity Section */}
        <div className="w-full md:w-72 bg-gradient-to-br from-[#111113] to-black p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id={`grid-${id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-${id})`} />
            </svg>
          </div>

          <div className="relative flex justify-between items-start">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Box className="text-white" size={28} />
            </div>
            <button 
              onClick={(e) => {
                e.preventDefault();
                setIsSaved(!isSaved);
              }}
              className={`p-3 rounded-xl border transition-all ${isSaved ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/10 text-white/20 hover:text-white hover:border-white/20'}`}
            >
              <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="relative mt-12">
            <div className="text-[10px] font-black tracking-[0.4em] text-blue-500 mb-2 uppercase">{tool.tagline}</div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-4">{tool.name}</h3>
            <div className="flex gap-2">
              <Badge className="border-white/10 text-[8px] font-black uppercase tracking-widest text-white/40">VER {tool.version}</Badge>
              <Badge className="border-white/10 text-[8px] font-black uppercase tracking-widest text-white/40">{tool.complexity}</Badge>
            </div>
          </div>
        </div>

        {/* Informational Content Section */}
        <div className="flex-1 p-10 md:p-12 flex flex-col justify-between">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 flex items-center gap-2">
                  <Terminal size={12} /> Functional Abstract
                </div>
                <p className="text-white/50 text-sm leading-relaxed font-medium">
                  {tool.description}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {tool.features.map((feature, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/60 border border-white/5 italic">
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-6">
               <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                 <Activity size={14} className="text-blue-500 mb-3" />
                 <div className="text-[8px] font-black uppercase tracking-widest text-white/20">Performance</div>
                 <div className="text-xs font-bold italic uppercase">Optimized</div>
               </div>
               <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                 <Shield size={14} className="text-emerald-500 mb-3" />
                 <div className="text-[8px] font-black uppercase tracking-widest text-white/20">Reliability</div>
                 <div className="text-xs font-bold italic uppercase">Stable Build</div>
               </div>
               <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                 <Layers size={14} className="text-purple-500 mb-3" />
                 <div className="text-[8px] font-black uppercase tracking-widest text-white/20">Integration</div>
                 <div className="text-xs font-bold italic uppercase">Full Sync</div>
               </div>
               <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                 <Zap size={14} className="text-amber-500 mb-3" />
                 <div className="text-[8px] font-black uppercase tracking-widest text-white/20">Compute</div>
                 <div className="text-xs font-bold italic uppercase">GPU Accel</div>
               </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-white/20 italic">
               <span className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full"></div> SketchUp 2024+</span>
               <span className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full"></div> Windows / MacOS</span>
            </div>
            
            <Link href={`/tools/${id}`}>
              <Button className="w-full sm:w-auto bg-white text-black hover:bg-blue-600 hover:text-white px-10 py-7 rounded-[20px] font-black uppercase tracking-widest text-[10px] transition-all group/btn shadow-xl shadow-black">
                Initialize Module
                <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Tools() {
  const products = Object.entries(EXTENSIONS_MOCK);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-600 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[60%] h-[40%] bg-blue-900/5 blur-[150px] rounded-full"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 p-8 flex justify-between items-center bg-gradient-to-b from-black to-transparent backdrop-blur-sm">
        <Link href="/" className="text-xl font-black tracking-[0.4em] italic uppercase">Studiø</Link>
        <div className="hidden md:flex gap-10 text-[9px] font-black tracking-[0.4em] uppercase text-white/40">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="text-blue-500">Tools</span>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Support</Link>
        </div>
        <div className="w-10 h-10 border border-white/10 rounded-xl flex items-center justify-center text-white/20">
          <Maximize size={16} />
        </div>
      </nav>

      <div className="container mx-auto max-w-6xl px-6 pt-40 pb-32">
        {/* Header Section */}
        <header className="mb-24 text-center md:text-left relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-600/5 border border-blue-600/20 text-blue-500 text-[9px] font-black uppercase tracking-[0.5em] mb-4 shadow-2xl shadow-blue-900/10">
              <Zap size={14} fill="currentColor" /> Advanced Facility Modules
            </div>
            <h1 className="text-6xl md:text-9xl font-black uppercase italic tracking-tighter leading-[0.8] mb-8">
              Available<br/><span className="text-blue-600">Inventory</span>
            </h1>
            <p className="max-w-xl text-white/40 text-sm md:text-base font-medium leading-relaxed uppercase tracking-wider">
              A collection of high-performance architectural extensions engineered to bypass native SketchUp limitations and automate creative workflows.
            </p>
          </motion.div>
        </header>

        {/* Tools List - Redesigned to Large Informational Dossiers */}
        <div className="space-y-10">
          {products.map(([key, product], index) => (
            <ToolCard 
              key={key} 
              id={key} 
              tool={product} 
              index={index} 
            />
          ))}
        </div>

        {/* Call to Action Footer Box */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32"
        >
          <div className="bg-[#0c0c0e] border border-white/5 p-12 md:p-20 rounded-[60px] text-center relative overflow-hidden group">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-full bg-gradient-to-b from-blue-600/10 to-transparent blur-3xl opacity-20"></div>
            <div className="relative z-10 space-y-8">
               <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto text-blue-500">
                 <Cpu size={40} />
               </div>
               <div className="space-y-4">
                 <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">Request Custom Module</h2>
                 <p className="text-white/40 max-w-lg mx-auto text-sm font-medium">Have a specific workflow bottleneck? Our engineering team builds bespoke architectural tools for enterprise clients.</p>
               </div>
               <Link href="/contact">
                 <Button className="bg-transparent border-2 border-white/10 text-white hover:bg-white hover:text-black font-black uppercase tracking-widest text-xs px-16 py-8 rounded-[24px] transition-all">
                   Contact System Architects
                 </Button>
               </Link>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Futuristic Footer */}
      <footer className="py-20 px-8 border-t border-white/5 bg-[#050505]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="text-2xl font-black tracking-[0.4em] italic uppercase">Studiø</div>
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Redefining Architectural Computation</p>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-8 text-[10px] font-black tracking-[0.4em] text-white/10 uppercase">
             <span>© 2025</span>
             <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
             <span>Muhamad Shkeir</span>
             <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
             <span>Riyadh Terminal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}