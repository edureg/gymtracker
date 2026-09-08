const fs = require('fs');
const path = 'src/utils/exportImport.ts';
let code = fs.readFileSync(path, 'utf8');

const oldFunc = /export function exportMasterDict\(action: 'share' \| 'download' = 'share'\) \{[\s\S]*?processFile\(fileName, blob, action\);\n\}/;

const newFunc = `export function exportMasterDict(currentRoutine: RoutineConfig, action: 'share' | 'download' = 'share') {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Maestro de Ejercicios", 14, 22);
    
    const master = getMasterExercises();
    const sorted = Object.values(master).sort((a, b) => a.name.localeCompare(b.name));
    
    const tableData = sorted.map(m => {
        const activeIn = Object.values(currentRoutine)
            .filter(r => r.exercises?.some(ex => ex.id === m.id && ex.isActive !== false))
            .map(r => r.title)
            .join(', ');
            
        return [
            m.name,
            m.notes || '-',
            activeIn || 'Ninguna'
        ];
    });

    autoTable(doc, {
        startY: 30,
        head: [['Ejercicio', 'Aclaraciones / Notas', 'Rutinas Activas']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [40, 167, 69] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
            0: { cellWidth: 50, fontStyle: 'bold' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 50, fontStyle: 'italic', textColor: [100, 100, 100] }
        }
    });

    const fileName = \`maestro_ejercicios_\${new Date().toISOString().split('T')[0]}.pdf\`;
    const blob = doc.output('blob');
    processFile(fileName, blob, action);
}`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync(path, code);
