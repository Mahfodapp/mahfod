const fs = require('fs');
const path = require('path');

const BUNDLE_PATH = 'c:/Users/dell/Desktop/mahfodap/apk_recovery/extracted/assets/index.android.bundle';
const OUTPUT_DIR = 'c:/Users/dell/Desktop/mahfodap/apk_recovery/extracted_source';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Reading bundle...');
const bundle = fs.readFileSync(BUNDLE_PATH, 'utf8');

// A Metro bundle module usually starts with: __d(function(global, require, module, exports, _dependencyMap) { ... }, module_id, [deps], "module_path");
// Or in production, the module_path string might be missing. We'll search for __d(
console.log('Extracting modules...');

let matchCount = 0;
// We'll split the bundle by "__d("
const parts = bundle.split('__d(');

// Create a mapping of module contents
const modules = [];

for (let i = 1; i < parts.length; i++) {
  const part = parts[i];
  
  // Try to extract the module ID. It's usually near the end of the part before the next __d
  // A cleaner way is to parse the arguments from the end of the function block.
  // We can look for the last closing brace '}' before the module id and deps array.
  
  const lastBraceIndex = part.lastIndexOf('}');
  if (lastBraceIndex === -1) continue;
  
  const tail = part.slice(lastBraceIndex + 1);
  // tail looks something like:  , 123, [456, 789], "src/screens/HomeScreen.js");
  
  // Let's use a regex to extract the module ID and path from the tail
  const tailMatch = tail.match(/\s*,\s*(\d+)\s*,\s*\[(.*?)\](?:\s*,\s*["']([^"']+)["'])?\s*\)/);
  
  if (tailMatch) {
    const moduleId = tailMatch[1];
    const modulePath = tailMatch[3] || `module_${moduleId}.js`;
    
    // The code is everything before the tail
    const code = part.slice(0, lastBraceIndex + 1);
    
    modules.push({ id: moduleId, path: modulePath, code });
    matchCount++;
  }
}

console.log(`Found ${matchCount} modules. Writing to ${OUTPUT_DIR}...`);

// Also save a big JSON with all modules for easy searching
const bundleData = {};

for (const mod of modules) {
  // Normalize path
  let safePath = mod.path.replace(/\\/g, '/');
  // Handle relative paths or node_modules
  if (safePath.startsWith('/')) safePath = safePath.slice(1);
  
  bundleData[mod.id] = { path: safePath, code: mod.code };
  
  const outPath = path.join(OUTPUT_DIR, safePath);
  const dir = path.dirname(outPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outPath, mod.code, 'utf8');
}

fs.writeFileSync(path.join(OUTPUT_DIR, 'bundle_modules.json'), JSON.stringify(bundleData, null, 2));

console.log('Done!');
