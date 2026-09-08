const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldExecuteExport = /const executeExport = \(type: 'csv' \| 'json' \| 'pdf' \| 'all'\) => \{[\s\S]*?closeExportModal\(\);\n  \};/;

const newExecuteExport = `const executeExport = (type: 'csv' | 'json' | 'pdf' | 'all', action: 'share' | 'download' = 'share') => {
    let startStr: string | undefined;
    let endStr: string | undefined;

    if (exportRangeType === '30_days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startStr = d.toISOString().split('T')[0];
    } else if (exportRangeType === 'custom') {
      startStr = exportStartDate;
      endStr = exportEndDate;
    }

    if (type === 'csv' || type === 'all') {
      exportCSV(routineConfig, startStr, endStr, action);
    }
    if (type === 'json' || type === 'all') {
      exportJSON(routineConfig, startStr, endStr, action);
    }
    if (type === 'pdf' || type === 'all') {
      exportPDF(routineConfig, startStr, endStr, action);
    }

    closeExportModal();
  };`;

code = code.replace(oldExecuteExport, newExecuteExport);
fs.writeFileSync(path, code);
