const fs = require('fs');
const path = require('path');

const patchPath = path.join(__dirname, 'patches', 'react-native-floating-bubble+1.0.12.patch');
let content = fs.readFileSync(patchPath, 'utf8');

// Convert all CRLF to LF
content = content.replace(/\r\n/g, '\n');

// Sometimes " \ No newline at end of file" gets modified to just "\ No newline at end of file"
// We should replace it with " \ No newline at end of file"
content = content.replace(/^\\ No newline at end of file/gm, '\\ No newline at end of file'); 

// Actually git requires `\ No newline...` lines to start with EXACTLY the `\` character. 
// Wait, the standard output of git diff is `\ No newline at end of file` with NO leading space for the `\` itself. BUT some parsers want it removed or format it differently.
// What if we just add newlines to the actual node_modules files and re-generate the patch?
// Let's just convert the patch to LF first.

fs.writeFileSync(patchPath, content);
console.log('Patch normalized to LF');
