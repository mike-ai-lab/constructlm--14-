/**
 * Universal Module Resolver for React Playground
 * 
 * Three-Tier Resolution Strategy:
 * 1. Core Runtime (pre-loaded)
 * 2. Dynamic CDN Loader (esm.sh, skypack, unpkg)
 * 3. Generic Proxy Fallback (safe defaults)
 * 
 * Features:
 * - Automatic module resolution
 * - CDN fallback chain
 * - Module caching
 * - Local/hosted module support
 * - Safe proxy fallbacks
 */

interface ModuleCache {
  [key: string]: any;
}

interface ResolverConfig {
  localModulePath?: string;
  hostedModuleUrl?: string;
  isProduction?: boolean;
}

// Module cache to avoid repeated network requests
const moduleCache: ModuleCache = {};

// CDN providers in priority order
const CDN_PROVIDERS = [
  'https://esm.sh/',
  'https://cdn.skypack.dev/',
  'https://unpkg.com/'
];

/**
 * Tier 1: Core Runtime Modules (always available)
 */
const CORE_MODULES = {
  'react': 'window.React',
  'react-dom': 'window.ReactDOM',
  'framer-motion': 'window.Motion',
  'lucide-react': 'window.LucideReact'
};

/**
 * Create a generic proxy fallback for unknown modules
 * Returns safe defaults to prevent crashes
 */
function createGenericProxy(moduleName: string): any {
  console.warn(`[Module Resolver] Using proxy fallback for: ${moduleName}`);
  
  return new Proxy({}, {
    get(target, prop: string) {
      // React component (starts with capital letter)
      if (prop[0] === prop[0].toUpperCase()) {
        return function Component(props: any) {
          if (typeof window !== 'undefined' && (window as any).React) {
            return (window as any).React.createElement(
              'div',
              { 
                ...props,
                style: { 
                  padding: '10px', 
                  border: '1px dashed #ccc', 
                  borderRadius: '4px',
                  color: '#666',
                  fontSize: '12px',
                  ...props.style 
                }
              },
              `[${moduleName}.${prop}]`
            );
          }
          return null;
        };
      }
      
      // React hook (starts with 'use')
      if (prop.startsWith('use')) {
        return function useHook(...args: any[]) {
          return Array.isArray(args[0]) ? [null, () => {}] : {};
        };
      }
      
      // Default export
      if (prop === 'default') {
        return createGenericProxy(moduleName);
      }
      
      // Generic function
      return function genericFunction(...args: any[]) {
        console.log(`[${moduleName}.${prop}] called with:`, args);
        return {};
      };
    }
  });
}

/**
 * Try to load module from CDN
 */
async function loadFromCDN(moduleName: string): Promise<any> {
  // Try each CDN provider in order
  for (const cdn of CDN_PROVIDERS) {
    try {
      const url = `${cdn}${moduleName}`;
      console.log(`[Module Resolver] Attempting CDN: ${url}`);
      
      // Use dynamic import
      const module = await import(/* @vite-ignore */ url);
      console.log(`[Module Resolver] ✓ Loaded from ${cdn}`);
      return module;
    } catch (error) {
      console.warn(`[Module Resolver] Failed to load from ${cdn}:`, error);
      continue;
    }
  }
  
  throw new Error(`Failed to load ${moduleName} from all CDN providers`);
}

/**
 * Load local or hosted module
 */
async function loadLocalOrHosted(
  moduleName: string, 
  config: ResolverConfig
): Promise<any> {
  const { localModulePath, hostedModuleUrl, isProduction } = config;
  
  // In production, always use hosted URL
  if (isProduction && hostedModuleUrl) {
    console.log(`[Module Resolver] Loading from hosted URL: ${hostedModuleUrl}`);
    try {
      const module = await import(/* @vite-ignore */ hostedModuleUrl);
      return module;
    } catch (error) {
      console.error(`[Module Resolver] Failed to load from hosted URL:`, error);
      throw error;
    }
  }
  
  // In development, try local path first
  if (localModulePath) {
    console.log(`[Module Resolver] Loading from local path: ${localModulePath}`);
    try {
      const module = await import(/* @vite-ignore */ localModulePath);
      return module;
    } catch (error) {
      console.warn(`[Module Resolver] Local path failed, trying hosted URL...`);
      
      // Fall back to hosted URL if available
      if (hostedModuleUrl) {
        const module = await import(/* @vite-ignore */ hostedModuleUrl);
        return module;
      }
      
      throw error;
    }
  }
  
  throw new Error(`No local or hosted path configured for ${moduleName}`);
}

/**
 * Main module resolver
 * Implements three-tier resolution strategy
 */
export async function resolveModule(
  moduleName: string,
  config: ResolverConfig = {}
): Promise<any> {
  // Check cache first
  if (moduleCache[moduleName]) {
    console.log(`[Module Resolver] ✓ Using cached: ${moduleName}`);
    return moduleCache[moduleName];
  }
  
  try {
    // Tier 1: Core Runtime Modules
    if (CORE_MODULES[moduleName as keyof typeof CORE_MODULES]) {
      const globalPath = CORE_MODULES[moduleName as keyof typeof CORE_MODULES];
      const module = eval(globalPath);
      if (module) {
        console.log(`[Module Resolver] ✓ Core module: ${moduleName}`);
        moduleCache[moduleName] = module;
        return module;
      }
    }
    
    // Check for local/hosted module configuration
    if (config.localModulePath || config.hostedModuleUrl) {
      try {
        const module = await loadLocalOrHosted(moduleName, config);
        moduleCache[moduleName] = module;
        return module;
      } catch (error) {
        console.warn(`[Module Resolver] Local/hosted failed, trying CDN...`);
      }
    }
    
    // Tier 2: Dynamic CDN Loader
    try {
      const module = await loadFromCDN(moduleName);
      moduleCache[moduleName] = module;
      return module;
    } catch (error) {
      console.warn(`[Module Resolver] CDN loading failed for ${moduleName}`);
    }
    
    // Tier 3: Generic Proxy Fallback
    console.warn(`[Module Resolver] Using proxy fallback for: ${moduleName}`);
    const proxy = createGenericProxy(moduleName);
    moduleCache[moduleName] = proxy;
    return proxy;
    
  } catch (error) {
    console.error(`[Module Resolver] Error resolving ${moduleName}:`, error);
    
    // Always return proxy as last resort
    const proxy = createGenericProxy(moduleName);
    moduleCache[moduleName] = proxy;
    return proxy;
  }
}

/**
 * Resolve multiple modules in parallel
 */
export async function resolveModules(
  modules: Array<{ name: string; config?: ResolverConfig }>
): Promise<Record<string, any>> {
  const results = await Promise.all(
    modules.map(({ name, config }) => 
      resolveModule(name, config).then(module => ({ name, module }))
    )
  );
  
  return results.reduce((acc, { name, module }) => {
    acc[name] = module;
    return acc;
  }, {} as Record<string, any>);
}

/**
 * Parse imports from code
 */
export function parseImports(code: string): Array<{ name: string; source: string; imports: string[] }> {
  const imports: Array<{ name: string; source: string; imports: string[] }> = [];
  const lines = code.split('\n');
  
  let inImportBlock = false;
  let currentImport = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('import ')) {
      inImportBlock = true;
      currentImport = trimmed;
      
      // Single-line import
      if (trimmed.includes(';') || (trimmed.includes('from') && trimmed.match(/['"]/) && trimmed.match(/['"]/)!.length >= 2)) {
        inImportBlock = false;
        parseImportLine(currentImport, imports);
        currentImport = '';
      }
      continue;
    }
    
    if (inImportBlock) {
      currentImport += ' ' + trimmed;
      if (trimmed.includes(';') || trimmed.includes('from')) {
        inImportBlock = false;
        parseImportLine(currentImport, imports);
        currentImport = '';
      }
    }
  }
  
  return imports;
}

function parseImportLine(
  importStr: string, 
  importsArray: Array<{ name: string; source: string; imports: string[] }>
): void {
  const match = importStr.match(/import\s+(?:(\w+)|(?:\{([^}]+)\})|(?:\*\s+as\s+(\w+)))\s+from\s+['"]([^'"]+)['"]/);
  
  if (match) {
    const defaultImport = match[1];
    const namedImports = match[2];
    const namespaceImport = match[3];
    const source = match[4];
    
    const importNames: string[] = [];
    
    if (defaultImport) importNames.push(defaultImport);
    if (namespaceImport) importNames.push(namespaceImport);
    if (namedImports) {
      namedImports.split(',').forEach(spec => {
        const cleaned = spec.trim().split(/\s+as\s+/).pop()?.trim();
        if (cleaned) importNames.push(cleaned);
      });
    }
    
    importsArray.push({
      name: source,
      source: source,
      imports: importNames
    });
  }
}

/**
 * Generate module injection code for runtime
 */
export function generateModuleInjectionCode(
  resolvedModules: Record<string, any>,
  imports: Array<{ name: string; source: string; imports: string[] }>
): string {
  const injectionCode: string[] = [];
  
  imports.forEach(({ source, imports: importNames }) => {
    const module = resolvedModules[source];
    if (!module) return;
    
    importNames.forEach(importName => {
      // Handle default import
      if (importName === importName[0].toUpperCase() || !module[importName]) {
        injectionCode.push(`const ${importName} = modules['${source}'].default || modules['${source}'];`);
      } else {
        // Handle named import
        injectionCode.push(`const ${importName} = modules['${source}'].${importName};`);
      }
    });
  });
  
  return injectionCode.join('\n');
}

/**
 * Clear module cache (useful for development)
 */
export function clearModuleCache(): void {
  Object.keys(moduleCache).forEach(key => delete moduleCache[key]);
  console.log('[Module Resolver] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; modules: string[] } {
  return {
    size: Object.keys(moduleCache).length,
    modules: Object.keys(moduleCache)
  };
}
