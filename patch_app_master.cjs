const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/import \{ loadRoutineConfig, saveRoutineConfig, getDayLog, saveDayLog, getLastDayMetrics \} from '\.\/utils\/storage';/, 
"import { loadRoutineConfig, saveRoutineConfig, getDayLog, saveDayLog, getLastDayMetrics, getMasterExercises, updateMasterExerciseNote } from './utils/storage';");

const oldBankLogic = `  // Compute Exercise Bank (all unique exercises across all days)
  const allExercisesMap = new Map<string, Exercise>();
  (Object.values(routineConfig) as Routine[]).forEach(day => {
    day.exercises?.forEach(ex => {
      if (!allExercisesMap.has(ex.id)) {
        allExercisesMap.set(ex.id, ex);
      }
    });
  });`;

const newBankLogic = `  // Compute Exercise Bank using Master Dictionary
  const allExercisesMap = new Map<string, Exercise>();
  const masterDict = getMasterExercises();
  
  // First load from master
  Object.values(masterDict).forEach(m => {
      allExercisesMap.set(m.id, { id: m.id, name: m.name, notes: m.notes, sets: 3, isActive: true });
  });

  // Then overlay any runtime specific defaults from routines (like sets, hasTime)
  (Object.values(routineConfig) as Routine[]).forEach(day => {
    day.exercises?.forEach(ex => {
      if (allExercisesMap.has(ex.id)) {
          const existing = allExercisesMap.get(ex.id)!;
          // Keep the master notes, but update sets/hasTime if missing
          existing.sets = ex.sets || existing.sets;
          existing.hasTime = ex.hasTime !== undefined ? ex.hasTime : existing.hasTime;
      } else {
          allExercisesMap.set(ex.id, ex);
      }
    });
  });`;

code = code.replace(oldBankLogic, newBankLogic);

// Also need to update the save logic in EditRoutineView's onUpdate!
const oldSyncLogic = `                 if (notesChanged.size > 0) {
                     Object.keys(newConf).forEach(rId => {
                         if (rId !== updated.id) {
                             const r = newConf[rId];
                             let modified = false;
                             const syncedExercises = r.exercises.map(ex => {
                                 if (notesChanged.has(ex.id)) {
                                     modified = true;
                                     return { ...ex, notes: notesChanged.get(ex.id)! };
                                 }
                                 return ex;
                             });
                             if (modified) {
                                 newConf[rId] = { ...r, exercises: syncedExercises };
                             }
                         }
                     });
                 }`;

const newSyncLogic = `                 if (notesChanged.size > 0) {
                     // Update the master dictionary
                     notesChanged.forEach((note, exId) => {
                         const exName = updated.exercises.find(e => e.id === exId)?.name || '';
                         updateMasterExerciseNote(exId, exName, note);
                     });
                     
                     // Sync to other routines
                     Object.keys(newConf).forEach(rId => {
                         if (rId !== updated.id) {
                             const r = newConf[rId];
                             let modified = false;
                             const syncedExercises = r.exercises.map(ex => {
                                 if (notesChanged.has(ex.id)) {
                                     modified = true;
                                     return { ...ex, notes: notesChanged.get(ex.id)! };
                                 }
                                 return ex;
                             });
                             if (modified) {
                                 newConf[rId] = { ...r, exercises: syncedExercises };
                             }
                         }
                     });
                 }`;

code = code.replace(oldSyncLogic, newSyncLogic);

fs.writeFileSync(path, code);
