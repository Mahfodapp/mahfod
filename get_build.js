const { execSync } = require('child_process');
const fs = require('fs');
try {
    const output = execSync('npx eas-cli build:view 7047d73b-a34a-4566-89b6-c73b847128a2 --json', { encoding: 'utf8', env: process.env, maxBuffer: 1024 * 1024 * 10 });
    fs.writeFileSync('build_view.json', output);
} catch (e) {
    fs.writeFileSync('build_view.json', e.toString());
}
