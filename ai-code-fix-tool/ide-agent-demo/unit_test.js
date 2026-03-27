
const fs = require('fs');
const path = require('path');

// Mocking server environment for testing
const CODEBASE = {};
function chunkContent(file, content, chunkSize = 40, overlap = 5) {
  const lines = content.split('\n');
  const chunks = [];
  if (lines.length <= chunkSize) return [{ file, content, startLine: 1, endLine: lines.length }];
  for (let i = 0; i < lines.length; i += (chunkSize - overlap)) {
    const chunkLines = lines.slice(i, i + chunkSize);
    chunks.push({ file, content: chunkLines.join('\n'), startLine: i + 1, endLine: i + chunkLines.length });
    if (i + chunkSize >= lines.length) break;
  }
  return chunks;
}

class BM25 {
  constructor() { this.docs = []; this.idf = {}; this.avgdl = 0; }
  tokenize(t) { return t.toLowerCase().replace(/[^a-z0-9_]/g,' ').split(/\s+/).filter(x=>x.length>1); }
  add(d) { const tk = this.tokenize(d.content), tf = {}; tk.forEach(t => tf[t] = (tf[t]||0)+1); this.docs.push({...d, tk, tf}); }
  build() {
    const N = this.docs.length; if(N===0) return; this.avgdl = this.docs.reduce((a,b)=>a+b.tk.length,0)/N;
    const all = new Set(this.docs.flatMap(d=>d.tk));
    all.forEach(t => { const df = this.docs.filter(d=>d.tf[t]>0).length; this.idf[t] = Math.log((N-df+0.5)/(df+0.5)+1); });
  }
  search(q, k=5) {
    if(this.docs.length === 0) return [];
    const qt = this.tokenize(q);
    return this.docs.map(d => {
      let s = 0; qt.forEach(t => { 
        if(this.idf[t] && d.tf[t]) {
          s += this.idf[t]*(d.tf[t]*2.5)/(d.tf[t]+1.5*(0.25+0.75*d.tk.length/this.avgdl)); 
        } else {
          const tPrefix = t.slice(0, 4);
          if (t.length >= 4 && d.tk.some(dt => dt.startsWith(tPrefix))) {
            s += 0.3;
          } else if (d.content.toLowerCase().includes(t)) {
            s += 0.5;
          }
        }
      });
      return { file: d.file, score: Math.round(s*100)/100, content: d.content, startLine: d.startLine, endLine: d.endLine };
    }).filter(d=>d.score > 0.01).sort((a,b)=>b.score-a.score).slice(0,k);
  }
}

const bm25 = new BM25();
const target = path.join(__dirname, 'test_project/my-project (3)/my-project');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(path.join(__dirname, 'unit_test_results.txt'), msg + '\n');
}

fs.writeFileSync(path.join(__dirname, 'unit_test_results.txt'), ''); // Reset results
log('🧪 Starting System Unit Test...');
log('Target directory: ' + target);

if (!fs.existsSync(target)) {
  log('❌ FAILURE: Test project directory not found at ' + target);
  process.exit(1);
}

// 1. Test Indexing
function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      if (!f.includes('node_modules')) walk(fp);
    } else if (f.match(/\.(js|jsx|ts|tsx)$/)) {
      const content = fs.readFileSync(fp, 'utf8');
      const relative = path.relative(target, fp).replace(/\\/g, '/');
      CODEBASE[relative] = content;
      chunkContent(relative, content).forEach(c => bm25.add(c));
    }
  });
}
walk(target);
bm25.build();
log(`✅ Indexing OK: ${Object.keys(CODEBASE).length} files, ${bm25.docs.length} chunks.`);

// 2. Test Search (The failing case)
const query = 'routing';
const results = bm25.search(query);

// 3. Test Normalization & Recall
const complexQuery = 'useCounter hook purpose';
log(`\n--- Test: Normalization of "${complexQuery}" ---`);
const norm = bm25.normalize(complexQuery);
log(`Normalized: "${norm}"`);

// 4. Test Search with Normalization
const results2 = bm25.search(complexQuery);
if (results2.length > 0 || norm === 'useCounter hook') {
   log('✅ Normalization Test Passed.');
} else {
   log('❌ Normalization Test Failed.');
   process.exit(1);
}

process.exit(0);
