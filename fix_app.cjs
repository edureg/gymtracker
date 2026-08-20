const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// modify executeExport
const oldExecuteExport = `  const executeExport = (type: 'csv' | 'json' | 'pdf' | 'all') => {
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
      exportCSV(routineConfig, startStr, endStr);
    }
    if (type === 'json' || type === 'all') {
      exportJSON(routineConfig, startStr, endStr);
    }
    if (type === 'pdf' || type === 'all') {
      exportPDF(routineConfig, startStr, endStr);
    }

    closeExportModal();
  };`;

const newExecuteExport = `  const executeExport = (type: 'csv' | 'json' | 'pdf' | 'all', action: 'share' | 'download' = 'share') => {
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

// fix modal HTML
const modalRegex = /<div className="fixed inset-0 z-50 flex items-center justify-center bg-black\/80 backdrop-blur-sm p-4">[\s\S]*?<div className="bg-slate-900 border border-white\/10 p-6 rounded-2xl w-full max-w-sm relative">/;
const newModalHeader = `<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm relative my-auto max-h-[90vh] overflow-y-auto flex flex-col">`;

code = code.replace(modalRegex, newModalHeader);

// Now update the buttons to be "Descargar" or "Compartir".
// Wait, the buttons are "Reporte en PDF", "Solo CSV", "Solo JSON", "Generar Todos"
// We can change the button layout to have two buttons per row: "Compartir" and "Descargar".
// Let's replace the buttons div.

const oldButtonsRegex = /<div className="space-y-3">[\s\S]*?<div className="pt-6 mt-4 border-t border-white\/10">/;

const newButtons = `<div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Reporte PDF</span>
                  <span className="text-xs text-gray-400 ml-auto">Ideal para leer</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => executeExport('pdf', 'share')} className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition text-sm font-semibold">Compartir</button>
                  <button onClick={() => executeExport('pdf', 'download')} className="flex-1 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition text-sm font-semibold">Descargar</button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Solo CSV</span>
                  <span className="text-xs text-gray-400 ml-auto">Para Excel</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => executeExport('csv', 'share')} className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition text-sm font-semibold">Compartir</button>
                  <button onClick={() => executeExport('csv', 'download')} className="flex-1 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition text-sm font-semibold">Descargar</button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Solo JSON</span>
                  <span className="text-xs text-gray-400 ml-auto">Para restaurar</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => executeExport('json', 'share')} className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition text-sm font-semibold">Compartir</button>
                  <button onClick={() => executeExport('json', 'download')} className="flex-1 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition text-sm font-semibold">Descargar</button>
                </div>
              </div>
              
              <div className="pt-6 mt-4 border-t border-white/10">`;

code = code.replace(oldButtonsRegex, newButtons);

// And update the routines export button to have share/download:
const oldRoutinesExportRegex = /<button \n\s*onClick=\{[^}]+\}\n\s*className="w-full py-3 bg-blue-500\/20 text-blue-400 border border-blue-500\/30 rounded-xl hover:bg-blue-500\/30 transition flex flex-col items-center justify-center mb-4"\n\s*>\n\s*<span className="font-semibold">Solo Plantillas \(PDF\)<\/span>\n\s*<\/button>/;

const newRoutinesExport = `<div className="flex gap-2 mb-4">
                  <button onClick={() => { exportRoutinesPDF(routineConfig, 'share'); closeExportModal(); }} className="flex-1 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/30 transition font-semibold">Compartir</button>
                  <button onClick={() => { exportRoutinesPDF(routineConfig, 'download'); closeExportModal(); }} className="flex-1 py-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition font-semibold">Descargar</button>
                </div>`;

code = code.replace(oldRoutinesExportRegex, newRoutinesExport);

// Update version to 11.9
code = code.replace(/Version 11\.8/g, 'Version 11.9');

fs.writeFileSync(path, code);
