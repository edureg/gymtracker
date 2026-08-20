const fs = require('fs');
const path = 'src/utils/exportImport.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/async function shareOrDownloadFile\(fileName: string, blob: Blob\) \{/, `async function shareOrDownloadFile(fileName: string, blob: Blob, forceDownload = false) {
    if (!forceDownload) {`);

code = code.replace(/try \{/, `try {`);

// This might be tricky. Let's just rewrite the helper function completely.
