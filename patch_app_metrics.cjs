const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldCode = `<div className="flex justify-between items-start mb-2">
              <div className="text-xl font-bold text-emerald-400 flex flex-wrap items-center gap-2">
                  <span>{currentDayRoutine?.title}</span>
                  <div className="flex gap-1 ml-auto">
                    <button 
                      onClick={() => openHistoryModal(currentDayRoutine)}
                      className="p-2 bg-emerald-400/10 text-emerald-400 rounded-lg hover:bg-emerald-400/20 transition-colors"
                      title="Ver Historial de Rutina"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    {!currentLogHasData && (
                        <button 
                          onClick={unlinkRoutineFromDay}
                          className="text-xs font-semibold text-orange-400 bg-orange-400/10 px-3 py-2 rounded-lg hover:bg-orange-400/20 whitespace-nowrap transition-colors"
                        >
                          Cambiar
                        </button>
                    )}
                  </div>
                </div>
            </div>`;

const newCode = `<div className="flex flex-col gap-1 w-full mb-2">
              <div className="flex justify-between items-start w-full">
                <div className="text-xl font-bold text-emerald-400 flex flex-wrap items-center gap-2">
                    <span>{currentDayRoutine?.title}</span>
                </div>
                <div className="flex gap-1 ml-auto">
                  <button 
                    onClick={() => openHistoryModal(currentDayRoutine)}
                    className="p-2 bg-emerald-400/10 text-emerald-400 rounded-lg hover:bg-emerald-400/20 transition-colors"
                    title="Ver Historial de Rutina"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  {!currentLogHasData && (
                      <button 
                        onClick={unlinkRoutineFromDay}
                        className="text-xs font-semibold text-orange-400 bg-orange-400/10 px-3 py-2 rounded-lg hover:bg-orange-400/20 whitespace-nowrap transition-colors"
                      >
                        Cambiar
                      </button>
                  )}
                </div>
              </div>
              {lastDayMetrics && (
                  <div className="text-xs font-medium text-emerald-500/70 italic">
                      Últ. vez ({lastDayMetrics.date.slice(5).replace('-', '/')})
                      {lastDayMetrics.duration ? \` | \${lastDayMetrics.duration}\` : ''}
                      {lastDayMetrics.calories ? \` | \${lastDayMetrics.calories} kcal\` : ''}
                      {(lastDayMetrics.avgHeartRate || lastDayMetrics.maxHeartRate) ? \` | \${lastDayMetrics.avgHeartRate || '-'}-\${lastDayMetrics.maxHeartRate || '-'} lpm\` : ''}
                  </div>
              )}
            </div>`;

if (code.includes('<span>{currentDayRoutine?.title}</span>')) {
    code = code.replace(oldCode, newCode);
    code = code.replace(/Version 11\.9/g, 'Version 11.10');
    fs.writeFileSync(path, code);
    console.log("Patched successfully!");
} else {
    console.log("Could not find the target code.");
}
