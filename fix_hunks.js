const fs = require('fs');

const path = 'patches/react-native-floating-bubble+1.0.12.patch';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split('\n');
let newLines = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    let match = line.match(/^@@ -(\d+),(\d+) \+(\d+),(\d+) @@(.*)$/);
    if (!match) {
        // Fallback for single line insertions
        match = line.match(/^@@ -(\d+) \+(\d+) @@(.*)$/);
    }
    
    if (match) {
        let rStart = match[1];
        let rCount = parseInt(match[2] !== undefined ? match[2] : 1, 10);
        let aStart = match[3];
        let aCount = parseInt(match[4] !== undefined ? match[4] : 1, 10);
        let extra = match[5] || '';
        
        let added = 0;
        let removed = 0;
        let ctx = 0;
        
        // Scan ahead to count
        for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j];
            if (nextLine.startsWith('@@ ') || nextLine.startsWith('diff --git')) {
                break;
            }
            if (nextLine.startsWith('+') && !nextLine.startsWith('+++')) {
                added++;
            } else if (nextLine.startsWith('-') && !nextLine.startsWith('---')) {
                removed++;
            } else if (nextLine.startsWith(' ') || nextLine === '') {
                ctx++;
            }
        }
        
        let newRCount = removed + ctx;
        let newACount = added + ctx;
        
        newLines.push(`@@ -${rStart},${newRCount} +${aStart},${newACount} @@${extra}`);
        console.log(`Fixed hunk at line ${i+1}: -${newRCount} +${newACount}`);
    } else {
        newLines.push(line);
    }
}

fs.writeFileSync(path, newLines.join('\n'));
console.log('Patch hunk headers fixed!');
