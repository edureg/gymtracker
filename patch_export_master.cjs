const fs = require('fs');
const path = 'src/utils/exportImport.ts';
let code = fs.readFileSync(path, 'utf8');

// import getMasterExercises
code = code.replace(/import \{ RoutineConfig \} from '\.\.\/types';/, "import { RoutineConfig } from '../types';\nimport { getMasterExercises } from './storage';");

const newExportFunc = `
export function exportMasterDict(action: 'share' | 'download' = 'share') {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Maestro de Ejercicios", 14, 22);
    
    const master = getMasterExercises();
    const sorted = Object.values(master).sort((a, b) => a.name.localeCompare(b.name));
    
    const tableData = sorted.map(m => [
        m.name,
        m.notes || '-'
    ]);

    autoTable(doc, {
        startY: 30,
        head: [['Ejercicio', 'Aclaraciones / Notas']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [40, 167, 69] },
        styles: { fontSize: 11, cellPadding: 4 },
        columnStyles: {
            0: { cellWidth: 60, fontStyle: 'bold' },
            1: { cellWidth: 'auto' }
        }
    });

    const fileName = \`maestro_ejercicios_\${new Date().toISOString().split('T')[0]}.pdf\`;
    const blob = doc.output('blob');
    processFile(fileName, blob, action);
}
`;

code = code + newExportFunc;
fs.writeFileSync(path, code);
