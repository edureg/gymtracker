const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// Imports
code = code.replace(/import \{ ChevronLeft,/, "import { ChevronLeft, BookOpen,");
code = code.replace(/import \{ loadRoutineConfig, saveRoutineConfig, getDayLog, saveDayLog, getLastDayMetrics, getMasterExercises, updateMasterExerciseNote \} from '\.\/utils\/storage';/, 
"import { loadRoutineConfig, saveRoutineConfig, getDayLog, saveDayLog, getLastDayMetrics, getMasterExercises, updateMasterExerciseNote, deleteMasterExercise } from './utils/storage';\nimport MasterManagerModal from './components/MasterManagerModal';");

// State
const stateInsertion = `  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMasterManagerOpen, setIsMasterManagerOpen] = useState(false);`;
code = code.replace(/  const \[isExportModalOpen, setIsExportModalOpen\] = useState\(false\);/, stateInsertion);

// Back button popstate handling
code = code.replace(/if \(routineForHistory \|\| isExportModalOpen\) \{/, "if (routineForHistory || isExportModalOpen || isMasterManagerOpen) {");
code = code.replace(/setIsExportModalOpen\(false\);/, "setIsExportModalOpen(false);\n          setIsMasterManagerOpen(false);");

// Render Buttons
const oldHeaderButtons = `            <button 
              onClick={openExportModal}
              className="p-3 bg-slate-900 border border-white/10 rounded-xl hover:bg-white/5 transition-colors shadow-sm cursor-pointer"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </button>`;

const newHeaderButtons = `            <div className="flex gap-2">
              <button 
                onClick={() => setIsMasterManagerOpen(true)}
                className="p-3 bg-slate-900 border border-white/10 rounded-xl hover:bg-white/5 transition-colors shadow-sm cursor-pointer"
                title="Maestro de Ejercicios"
              >
                <BookOpen className="w-5 h-5 text-gray-400" />
              </button>
              <button 
                onClick={openExportModal}
                className="p-3 bg-slate-900 border border-white/10 rounded-xl hover:bg-white/5 transition-colors shadow-sm cursor-pointer"
                title="Configuración y Backups"
              >
                <Settings className="w-5 h-5 text-gray-400" />
              </button>
            </div>`;

code = code.replace(oldHeaderButtons, newHeaderButtons);

// Render Modal at bottom
const modalRender = `      {isMasterManagerOpen && (
        <MasterManagerModal
          masterDict={getMasterExercises()}
          routineConfig={routineConfig}
          onClose={() => setIsMasterManagerOpen(false)}
          onDelete={(id) => {
            deleteMasterExercise(id);
            setRefreshTrigger(prev => prev + 1);
          }}
          onUpdate={(id, name, notes) => {
            updateMasterExerciseNote(id, name, notes);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
      {isExportModalOpen && (`;

code = code.replace(/      \{isExportModalOpen && \(/, modalRender);

// Version
code = code.replace(/Version 11\.12/g, 'Version 11.13');

fs.writeFileSync(path, code);
