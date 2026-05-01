const fs = require('fs');

const path = 'patches/react-native-floating-bubble+1.0.12.patch';
let content = fs.readFileSync(path, 'utf8');

// remove trailing blank lines
content = content.replace(/\n+$/, '');

const lines = content.split('\n');
let newLines = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    let match = line.match(/^@@ -(\d+),(\d+) \+(\d+),(\d+) @@(.*)$/);
    if (!match) {
        match = line.match(/^@@ -(\d+) \+(\d+) @@(.*)$/);
    }
    
    if (match) {
        let rStart = match[1];
        let aStart = match[3] !== undefined ? match[3] : match[2];
        let extra = match[5] !== undefined ? match[5] : (match[3] !== undefined ? match[3] : '');
        if (line.match(/^@@ -(\d+),(\d+) \+(\d+),(\d+) @@(.*)$/)) {
            // it's full match
        } else {
             aStart = match[2];
             extra = match[3];
        }
        
        let added = 0;
        let removed = 0;
        let ctx = 0;
        
        for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j];
            if (nextLine.startsWith('@@ ') || nextLine.startsWith('diff --git')) {
                break;
            }
            if (nextLine.startsWith('+') && !nextLine.startsWith('+++')) {
                added++;
            } else if (nextLine.startsWith('-') && !nextLine.startsWith('---')) {
                removed++;
            } else if (nextLine.startsWith(' ') || nextLine.startsWith('\\')) {
                if (nextLine.startsWith(' ')) ctx++;
                // we ignore \ No newline at end of file
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

// Ensure patch ends with a single newline
fs.writeFileSync(path, newLines.join('\n') + '\n');
console.log('Patch hunk headers fixed strictly!');
