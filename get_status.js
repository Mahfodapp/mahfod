const { execSync } = require('child_process');
const fs = require('fs');
try {
    const output = execSync('git --no-pager status --porcelain', { encoding: 'utf8', env: process.env });
    fs.writeFileSync('gitstatus.txt', output || 'No changes');
} catch (e) {
    fs.writeFileSync('gitstatus.txt', e.toString());
}
