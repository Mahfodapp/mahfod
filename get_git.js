const { execSync } = require('child_process');
const fs = require('fs');
try {
    const output = execSync('git log --oneline -n 20', { encoding: 'utf8', env: process.env });
    fs.writeFileSync('gitlog.txt', output);
} catch (e) {
    fs.writeFileSync('gitlog.txt', e.toString());
}
