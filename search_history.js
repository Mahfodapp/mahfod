const fs = require('fs');
const path = require('path');

const historyDir = path.join(process.env.APPDATA, 'Code', 'User', 'History');
const results = [];

function searchDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            searchDir(path.join(dir, entry.name));
        } else if (entry.isFile()) {
            if (entry.name === 'entries.json') {
                try {
                    const content = fs.readFileSync(path.join(dir, entry.name), 'utf8');
                    const parsed = JSON.parse(content);
                    const resourceStr = decodeURIComponent(parsed.resource || '').toLowerCase();
                    if (resourceStr.includes('mahfodap')) {
                        results.push({
                            resource: parsed.resource,
                            dir: dir,
                            entries: parsed.entries
                        });
                    }
                } catch (e) {}
            }
        }
    }
}

searchDir(historyDir);
fs.writeFileSync('vscode_history_matches.json', JSON.stringify(results, null, 2));
