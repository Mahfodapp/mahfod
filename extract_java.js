const fs = require('fs');
const patchContent = fs.readFileSync('patches/react-native-floating-bubble+1.0.12.patch', 'utf8');

function extractFile(filePath) {
    const startStr = `--- a/${filePath}\n+++ b/${filePath}\n@@`;
    let startIndex = patchContent.indexOf(`--- a/${filePath}`);
    if (startIndex === -1) startIndex = patchContent.indexOf(`--- /dev/null\n+++ b/${filePath}`);
    
    if (startIndex !== -1) {
        let content = patchContent.slice(startIndex);
        content = content.split('diff --git')[0];
        const lines = content.split('\n');
        let newContent = '';
        let pastHeader = false;
        for (let line of lines) {
            if (line.startsWith('@@')) { pastHeader = true; continue; }
            if (!pastHeader) continue;
            
            if (line.startsWith('+')) {
                newContent += line.substring(1) + '\n';
            } else if (line.startsWith(' ') || line === '') {
                newContent += (line.startsWith(' ') ? line.substring(1) : line) + '\n';
            }
        }
        fs.writeFileSync(filePath, newContent.trim() + '\n');
        console.log('Extracted ' + filePath);
    }
}

extractFile('node_modules/react-native-floating-bubble/android/src/main/java/com/reactlibrary/RNFloatingBubbleModule.java');
extractFile('node_modules/react-native-floating-bubble/android/src/main/res/layout/trash_zone_layout.xml');
