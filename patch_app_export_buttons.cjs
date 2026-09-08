const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// Also import exportMasterDict
code = code.replace(/exportRoutinesPDF \} from '\.\/utils\/exportImport';/, "exportRoutinesPDF, exportMasterDict } from './utils/exportImport';");

const oldSectionRegex = /<div className="pt-6 mt-4 border-t border-white\/10">[\s\S]*?<\/div>\s*<div className="pt-4 border-t border-white\/10">/;

const newSection = `<div className="pt-6 mt-4 border-t border-white/10">
                <h3 className="text-lg font-bold mb-2">Plantillas de Rutinas</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Descargá un listado limpio con los ejercicios de tus rutinas.
                </p>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => { exportRoutinesPDF(routineConfig, 'share'); closeExportModal(); }} className="flex-1 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/30 transition font-semibold">Compartir</button>
                  <button onClick={() => { exportRoutinesPDF(routineConfig, 'download'); closeExportModal(); }} className="flex-1 py-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition font-semibold">Descargar</button>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-white/10">
                <h3 className="text-lg font-bold mb-2">Maestro de Ejercicios</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Exportá el diccionario con todos tus ejercicios y sus aclaraciones técnicas en PDF.
                </p>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => { exportMasterDict('share'); closeExportModal(); }} className="flex-1 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/30 transition font-semibold">Compartir</button>
                  <button onClick={() => { exportMasterDict('download'); closeExportModal(); }} className="flex-1 py-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition font-semibold">Descargar</button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">`;

if (code.match(oldSectionRegex)) {
    code = code.replace(oldSectionRegex, newSection);
} else {
    console.log("Could not find modal section");
}

code = code.replace(/Version 11\.10/g, 'Version 11.11');

fs.writeFileSync(path, code);
