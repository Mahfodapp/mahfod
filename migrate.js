const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const APP_TSX = path.join(__dirname, 'App.tsx');

// File mapping: old relative to src -> new relative to src
const fileMap = {
  // Services
  'services/memo.service.ts': 'features/memo/services/memo.service.ts',
  'services/noter.service.ts': 'features/memo/services/noter.service.ts',
  'services/FloatingBubbleService.ts': 'features/srs/services/FloatingBubbleService.ts',
  'services/srsEngine.ts': 'features/srs/services/srsEngine.ts',
  // Logic
  'logic/intervals.ts': 'features/srs/logic/intervals.ts',
  'logic/sync.ts': 'features/sync/sync.ts',
  // Theme
  'theme/spacing.ts': 'shared/theme/spacing.ts',
  'theme/typography.ts': 'shared/theme/typography.ts',
  'theme/ui.ts': 'shared/theme/ui.ts',
  'theme/index.ts': 'shared/theme/index.ts',
  // Components
  'components/common/MahfodButton.tsx': 'shared/ui/MahfodButton.tsx',
  'components/common/IslamicPatternBg.tsx': 'shared/ui/IslamicPatternBg.tsx',
  'components/navigation/TabBar.tsx': 'shared/ui/TabBar.tsx',
};

// Add dynamically
const walk = (dir, fileList = []) => {
  if (!fs.existsSync(dir)) return fileList;
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p, fileList);
    } else {
      fileList.push(p);
    }
  });
  return fileList;
};

// Map i18n
if (fs.existsSync(path.join(SRC_DIR, 'i18n'))) {
  const i18nFiles = walk(path.join(SRC_DIR, 'i18n'));
  i18nFiles.forEach(f => {
    const rel = path.relative(SRC_DIR, f).replace(/\\/g, '/');
    fileMap[rel] = rel.replace('i18n/', 'shared/i18n/');
  });
}

// Convert map to absolute paths
const absMap = new Map(); // oldAbs -> newAbs
for (const [oldRel, newRel] of Object.entries(fileMap)) {
  absMap.set(path.join(SRC_DIR, oldRel), path.join(SRC_DIR, newRel));
}

function resolveModule(baseDir, importStr) {
  let target = path.resolve(baseDir, importStr);
  const exts = ['', '.ts', '.tsx', '.js', '/index.ts', '/index.js'];
  for (const ext of exts) {
     if (fs.existsSync(target + ext)) return target + ext;
  }
  return null;
}

// Prepare file contents and analyze imports BEFORE moving
const allTsFiles = walk(SRC_DIR).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
allTsFiles.push(APP_TSX);

const fileData = new Map(); // oldAbs -> { content, newAbs, replacements: [{oldStr, newStr}] }

allTsFiles.forEach(oldAbs => {
  let content = fs.readFileSync(oldAbs, 'utf8');
  let newAbs = absMap.get(oldAbs) || oldAbs;
  
  const replacements = [];
  const importRegex = /(import|export)\s+(?:.*?from\s+)?['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importStr = match[2];
    if (!importStr.startsWith('.')) continue; // skip non-relative
    
    const importedOldAbs = resolveModule(path.dirname(oldAbs), importStr);
    if (!importedOldAbs) continue;
    
    const importedNewAbs = absMap.get(importedOldAbs) || importedOldAbs;
    
    // if neither the current file nor the imported file moved, skip
    if (newAbs === oldAbs && importedNewAbs === importedOldAbs) continue;
    
    let newRel = path.relative(path.dirname(newAbs), importedNewAbs);
    newRel = newRel.replace(/\.tsx?$/, ''); // drop extension
    newRel = newRel.replace(/\\/g, '/'); // windows fix
    
    // Strip trailing /index
    if (newRel.endsWith('/index')) newRel = newRel.slice(0, -6);
    
    if (!newRel.startsWith('.')) newRel = './' + newRel;
    
    replacements.push({ oldStr: importStr, newStr: newRel });
  }
  
  fileData.set(oldAbs, { content, newAbs, replacements });
});

// Execute Moves
for (const [oldAbs, data] of fileData.entries()) {
  if (oldAbs !== data.newAbs) {
    fs.mkdirSync(path.dirname(data.newAbs), { recursive: true });
    fs.renameSync(oldAbs, data.newAbs);
  }
}

// Apply Replacements & Write
for (const [oldAbs, data] of fileData.entries()) {
  let { content, newAbs, replacements } = data;
  if (replacements.length > 0) {
    // To avoid replacing the wrong things, we replace backwards or carefully
    // Since we just have simple strings, let's do a simple replace
    for (const rep of replacements) {
       // Only match inside quotes to be safe
       const regex = new RegExp(`(['"])${rep.oldStr}(['"])`, 'g');
       content = content.replace(regex, `$1${rep.newStr}$2`);
    }
  }
  fs.writeFileSync(newAbs, content, 'utf8');
}

// Final cleanup: Try removing empty old directories
const dirsToClean = ['screens', 'services', 'store', 'logic', 'theme', 'i18n', 'components/ui', 'db'];
dirsToClean.forEach(d => {
  const p = path.join(SRC_DIR, d);
  if (fs.existsSync(p)) {
    try { fs.rmdirSync(p, { recursive: true }); } catch (e) {}
  }
});

console.log("Migration executed successfully.");
