const fs = require('fs');

const path = 'src/utils/exportImport.ts';
let code = fs.readFileSync(path, 'utf8');

// Add helper
const helper = `async function shareOrDownloadFile(fileName: string, blob: Blob) {
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
    
    // Fallback to download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

`;

if (!code.includes('shareOrDownloadFile')) {
    code = code.replace(/import \{ .* \} from 'jspdf';|import jsPDF from 'jspdf';/, (match) => match + '\n\n' + helper);
}

// exportRoutinesPDF
code = code.replace(/doc\.save\(\`plantillas_rutinas_\$\{new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\}\.pdf\`\);/, `const fileName = \`plantillas_rutinas_\${new Date().toISOString().split('T')[0]}.pdf\`;
    const blob = doc.output('blob');
    shareOrDownloadFile(fileName, blob);`);

// exportPDF
code = code.replace(/doc\.save\(\`gym_export_\$\{new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\}\.pdf\`\);/, `const fileName = \`gym_export_\${new Date().toISOString().split('T')[0]}.pdf\`;
    const blob = doc.output('blob');
    shareOrDownloadFile(fileName, blob);`);

// exportCSV
code = code.replace(/const link = document\.createElement\("a"\);[\s\S]*?URL\.revokeObjectURL\(url\);/, `const fileName = \`gym_export_\${new Date().toISOString().split('T')[0]}.csv\`;
    shareOrDownloadFile(fileName, blob);`);

// exportJSON
code = code.replace(/const link = document\.createElement\("a"\);[\s\S]*?URL\.revokeObjectURL\(url\);/, `const fileName = \`gym_export_\${new Date().toISOString().split('T')[0]}.json\`;
    shareOrDownloadFile(fileName, blob);`);

fs.writeFileSync(path, code);
