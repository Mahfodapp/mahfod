const { execSync } = require('child_process');
const fs = require('fs');
try {
    // 1. Rename src just in case
    if (fs.existsSync('src') && !fs.existsSync('src_ai_ruined')) {
        fs.renameSync('src', 'src_ai_ruined');
    }

    // 2. Hard reset to the specific commit from EAS
    const output = execSync('git reset --hard 68ae1e0f', { encoding: 'utf8', env: process.env, maxBuffer: 1024 * 1024 * 10 });
    fs.writeFileSync('git_restore_log.txt', output);
} catch (e) {
    fs.writeFileSync('git_restore_log.txt', e.toString());
}
