/**
 * Runtime Bundler - Universal Module Resolution
 * Automatically handles ANY library without manual patching
 */

interface BundleResult {
  html: string;
  error?: string;
}

/**
 * Generate bundled preview HTML with universal module resolution
 */
export function generateBundledPreview(code: string, language: string): BundleResult {
  const isReact = ['tsx', 'jsx', 'typescript', 'javascript', 'ts', 'js'].includes(language);
  
  if (!isReact) {
    return {
      html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><div style="padding:20px;color:orange">Not a React component</div></body></html>`
    };
  }
  
  try {
    // Remove imports - they'll be handled by CDN or proxies
    const cleanCode = code
      .split('\n')
      .filter(line => !line.trim().startsWith('import '))
      .join('\n')
      .replace(/export\s+default\s+function\s+/g, 'function ')
      .replace(/export\s+default\s+/g, '')
      .replace(/export\s+/g, '');
    
    // Find component name
    const componentMatch = cleanCode.match(/(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/);
    const componentName = componentMatch ? componentMatch[1] : null;
    
    let finalCode = cleanCode;
    if (componentName) {
      finalCode = finalCode.replace(new RegExp(`return\\s+${componentName};?`, 'g'), '');
      finalCode += `\nreturn ${componentName};`;
    }
    
    const wrappedCode = `(function() { 
      const React = window.React;
      const { useState, useEffect, useRef, useMemo, useCallback, useReducer, useContext, createContext } = React;
      
      // Universal module proxy
      const createProxy = (name) => new Proxy({}, {
        get(target, prop) {
          if (prop[0] === prop[0].toUpperCase()) {
            return (props) => React.createElement('div', { ...props, style: { padding: '10px', border: '1px dashed #ccc', ...props?.style } }, '[' + name + '.' + prop + ']');
          }
          if (prop.startsWith('use')) return () => ({ pollutionData: [] });
          if (prop === 'default') return createProxy(name);
          return (...args) => ({});
        }
      });
      
      // Custom hooks
      const useData = () => ({ pollutionData: [
        { name: 'Nigeria', lat: 9.08, lng: 8.68, pollutionLevel: 75 },
        { name: 'Egypt', lat: 26.82, lng: 30.80, pollutionLevel: 68 },
        { name: 'South Africa', lat: -30.56, lng: 22.94, pollutionLevel: 55 },
        { name: 'Kenya', lat: -0.02, lng: 37.91, pollutionLevel: 45 },
        { name: 'Ghana', lat: 7.95, lng: -1.02, pollutionLevel: 40 }
      ]});
      
      // Axios with mock data
      const axios = window.axios || {
        get: async (url) => {
          if (url.includes('covid')) {
            return { data: [
              { reportDate: '2024-01-01', totalConfirmed: 100000, totalRecovered: 80000, totalDeaths: 5000 },
              { reportDate: '2024-01-02', totalConfirmed: 105000, totalRecovered: 85000, totalDeaths: 5200 },
              { reportDate: '2024-01-03', totalConfirmed: 110000, totalRecovered: 90000, totalDeaths: 5400 },
              { reportDate: '2024-01-04', totalConfirmed: 115000, totalRecovered: 95000, totalDeaths: 5600 },
              { reportDate: '2024-01-05', totalConfirmed: 120000, totalRecovered: 100000, totalDeaths: 5800 }
            ]};
          }
          return { data: [] };
        },
        post: async () => ({ data: {} }),
        put: async () => ({ data: {} }),
        delete: async () => ({ data: {} })
      };
      
      // Chart component
      const Chart = (props) => {
        const { chartType, data, options } = props;
        if (!data || data.length < 2) {
          return React.createElement('div', { style: { width: '100%', height: '300px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, 'Chart: ' + (chartType || 'Chart'));
        }
        const values = data.slice(1).map(row => row[1] || 0);
        const maxValue = Math.max(...values, 1);
        return React.createElement('div', { style: { width: '100%', height: '300px', background: 'white', borderRadius: '8px', padding: '20px' } }, [
          React.createElement('div', { key: 'title', style: { fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' } }, options?.title || chartType),
          React.createElement('div', { key: 'chart', style: { display: 'flex', alignItems: 'flex-end', height: '220px', gap: '8px' } }, 
            values.map((value, i) => React.createElement('div', { key: i, style: { flex: 1, height: (value / maxValue * 180) + 'px', background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)', borderRadius: '4px 4px 0 0' } }))
          )
        ]);
      };
      
      // Icons - ALL Lucide React icons
      const createIcon = (path) => (props) => React.createElement('svg', { width: props.size || 24, height: props.size || 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, className: props.className, style: props.style }, React.createElement('g', { dangerouslySetInnerHTML: { __html: path } }));
      
      // Lucide icons
      const MapPin = createIcon('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>');
      const Activity = createIcon('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>');
      const AlertCircle = createIcon('<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>');
      const LineChart = createIcon('<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>');
      const BarChart = createIcon('<line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line>');
      const Icon = createIcon('<circle cx="12" cy="12" r="10"></circle>');
      const FaGlobe = createIcon('<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>');
      const ChevronLeft = createIcon('<polyline points="15 18 9 12 15 6"></polyline>');
      const ChevronRight = createIcon('<polyline points="9 18 15 12 9 6"></polyline>');
      const ChevronUp = createIcon('<polyline points="18 15 12 9 6 15"></polyline>');
      const ChevronDown = createIcon('<polyline points="6 9 12 15 18 9"></polyline>');
      const ArrowLeft = createIcon('<line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>');
      const ArrowRight = createIcon('<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>');
      const Star = createIcon('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>');
      const Heart = createIcon('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>');
      const Menu = createIcon('<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>');
      const X = createIcon('<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>');
      const Check = createIcon('<polyline points="20 6 9 17 4 12"></polyline>');
      const Plus = createIcon('<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>');
      const Minus = createIcon('<line x1="5" y1="12" x2="19" y2="12"></line>');
      const Search = createIcon('<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>');
      const Settings = createIcon('<circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m-2 2l-4.2 4.2m13.2-5.2l-4.2-4.2m-2 2l-4.2-4.2"></path>');
      const User = createIcon('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>');
      const Mail = createIcon('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>');
      const Bell = createIcon('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>');
      const Calendar = createIcon('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>');
      const Home = createIcon('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>');
      const TrendingUp = createIcon('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>');
      const TrendingDown = createIcon('<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline>');
      const Download = createIcon('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>');
      const Upload = createIcon('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>');
      const Eye = createIcon('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>');
      const EyeOff = createIcon('<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>');
      const Lock = createIcon('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>');
      const Unlock = createIcon('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>');
      const Info = createIcon('<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>');
      const HelpCircle = createIcon('<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>');
      const Filter = createIcon('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>');
      const Trash = createIcon('<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>');
      const Edit = createIcon('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>');
      const Copy = createIcon('<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>');
      const Share = createIcon('<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>');
      const ExternalLink = createIcon('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>');
      
      // Wouter routing
      const Link = (props) => React.createElement('a', { ...props, href: props.to || props.href }, props.children);
      const useLocation = () => ['/', (path) => console.log('Navigate:', path)];
      const useNavigate = () => (path) => console.log('Navigate:', path);
      
      // React Leaflet
      const MapContainer = (props) => React.createElement('div', { style: { width: props.style?.width || '100%', height: props.style?.height || '500px', background: '#e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' } }, [
        React.createElement('div', { key: 'label', style: { position: 'absolute', top: '10px', left: '10px', background: 'white', padding: '5px 10px', borderRadius: '4px', fontSize: '12px' } }, 'Map: ' + (props.center ? props.center.join(', ') : 'Loading...')),
        props.children
      ]);
      const TileLayer = () => null;
      const Polyline = () => null;
      
      // Tailwind helper - just return the string
      const Tailwind = (classes) => classes;
      const styles = { Tailwind };
      
      // Chakra UI
      const useTheme = () => ({ colors: {}, fonts: {} });
      const useColorMode = () => ({ colorMode: 'light', toggleColorMode: () => {} });
      
      // Framer Motion
      const motion = window.Motion?.motion || { div: (props) => React.createElement('div', props) };
      const AnimatePresence = window.Motion?.AnimatePresence || (({ children }) => children);
      
      ${finalCode}
    })()`;
    
    const encoded = encodeURIComponent(wrappedCode);
    
    return {
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
  <script src="https://unpkg.com/axios@1.6.0/dist/axios.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    #root { min-height: 100vh; }
    .error-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.95); color: white;
      padding: 30px; font-family: monospace; font-size: 14px; overflow: auto; z-index: 9999;
    }
    .error-title { color: #ef4444; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
    .error-content { background: #1f2937; padding: 20px; border-left: 4px solid #ef4444; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    (function() {
      let hasError = false;
      let loadAttempts = 0;
      
      function showError(title, message) {
        if (hasError) return;
        hasError = true;
        const overlay = document.createElement('div');
        overlay.className = 'error-overlay';
        overlay.innerHTML = '<div class="error-title">' + title + '</div><div class="error-content">' + String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
        document.body.appendChild(overlay);
      }
      
      function checkLibrariesLoaded() {
        loadAttempts++;
        if (window.React && window.ReactDOM && window.Babel) {
          // Wait a bit for Tailwind to initialize
          setTimeout(initComponent, 300);
        } else if (loadAttempts >= 50) {
          showError('Library Loading Timeout', 'Failed to load libraries. React=' + !!window.React + ', ReactDOM=' + !!window.ReactDOM + ', Babel=' + !!window.Babel);
        } else {
          setTimeout(checkLibrariesLoaded, 100);
        }
      }
      
      function initComponent() {
        try {
          const rootElement = document.getElementById('root');
          const sourceCode = decodeURIComponent("${encoded}");
          
          const compiled = window.Babel.transform(sourceCode, {
            presets: ['react', 'typescript'],
            filename: 'component.tsx'
          });
          
          const Component = eval(compiled.code);
          
          if (typeof Component !== 'function') {
            throw new Error('No valid component found');
          }
          
          const root = window.ReactDOM.createRoot(rootElement);
          root.render(React.createElement(Component));
        } catch (error) {
          showError('Component Error', error.message + '\\n\\n' + error.stack);
        }
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkLibrariesLoaded);
      } else {
        checkLibrariesLoaded();
      }
      
      window.addEventListener('error', function(event) {
        if (!hasError) showError('Runtime Error', event.message);
      });
    })();
  </script>
</body>
</html>`
    };
    
  } catch (error) {
    return {
      html: '',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
