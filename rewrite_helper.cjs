const fs = require('fs');
const path = 'src/utils/exportImport.ts';
let code = fs.readFileSync(path, 'utf8');

const oldHelperMatch = code.match(/async function shareOrDownloadFile[\s\S]*?URL\.revokeObjectURL\(url\);\n\}/);
if (oldHelperMatch) {
    const newHelper = `async function processFile(fileName: string, blob: Blob, action: 'share' | 'download') {
    if (action === 'share') {
        try {
            if (navigator.canShare) {
                const file = new File([blob], fileName, { type: blob.type });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: fileName,
                        files: [file]
                    });
                    return;
                }
            }
        } catch (error: any) {
            console.log('Share failed or was cancelled:', error);
            if (error.name === 'AbortError') return; // User explicitly cancelled
        }
    }
    
    // Fallback to download or if action === 'download'
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}`;
    code = code.replace(oldHelperMatch[0], newHelper);
    
    code = code.replace(/shareOrDownloadFile\(fileName, blob\)/g, "processFile(fileName, blob, (window as any).__exportAction || 'share')");
    
    fs.writeFileSync(path, code);
} else {
    console.log("Helper not found");
}
