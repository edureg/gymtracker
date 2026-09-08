const fs = require('fs');
const path = 'src/utils/storage.ts';
let code = fs.readFileSync(path, 'utf8');

const masterDictCode = `

export interface MasterExercise {
    id: string;
    name: string;
    notes: string;
}

export function getMasterExercises(): Record<string, MasterExercise> {
    const saved = localStorage.getItem('gym_master_exercises');
    if (saved) return JSON.parse(saved);
    
    // Fallback: migrate from current routineConfig if empty
    const routines = loadRoutineConfig();
    const master: Record<string, MasterExercise> = {};
    Object.values(routines).forEach(r => {
        r.exercises?.forEach(ex => {
            if (!master[ex.id]) {
                master[ex.id] = { id: ex.id, name: ex.name, notes: ex.notes || '' };
            } else {
                // Keep the longest note if there's a conflict
                if ((ex.notes || '').length > master[ex.id].notes.length) {
                    master[ex.id].notes = ex.notes;
                }
            }
        });
    });
    saveMasterExercises(master);
    return master;
}

export function saveMasterExercises(dict: Record<string, MasterExercise>) {
    localStorage.setItem('gym_master_exercises', JSON.stringify(dict));
}

export function updateMasterExerciseNote(id: string, name: string, notes: string) {
    const master = getMasterExercises();
    if (!master[id]) {
        master[id] = { id, name, notes };
    } else {
        master[id].notes = notes;
        master[id].name = name; // Update name just in case
    }
    saveMasterExercises(master);
}
`;

code += masterDictCode;
fs.writeFileSync(path, code);
