const { execSync } = require('child_process');
const fs = require('fs');
try {
    const output = execSync('git diff --stat HEAD', { encoding: 'utf8', env: process.env });
    fs.writeFileSync('gitdiff.txt', output || 'No changes');
} catch (e) {
    fs.writeFileSync('gitdiff.txt', e.toString());
}
