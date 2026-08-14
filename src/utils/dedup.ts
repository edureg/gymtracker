import { loadRoutineConfig, saveRoutineConfig } from './storage';
import { RoutineConfig, Routine, Exercise } from '../types';

export function runDeepCleanDeduplication() {
    if (localStorage.getItem('gym_v11_4_dedup_done')) return;

    console.log("Running Deep Clean Deduplication...");
    
    const routineConfig = loadRoutineConfig();
    const idToCanonicalMap = new Map<string, string>();
    const canonicalExercises = new Map<string, { id: string, name: string }>();

    // 1. Gather all unique exercises by normalized name
    // From routines:
    Object.values(routineConfig).forEach(r => {
        r.exercises.forEach(ex => {
            const normalizedName = ex.name.trim().toLowerCase();
            const cleanId = normalizedName.replace(/\s+/g, '_');
            
            if (!canonicalExercises.has(normalizedName)) {
                canonicalExercises.set(normalizedName, { id: cleanId, name: ex.name.trim() });
            }
            idToCanonicalMap.set(ex.id, canonicalExercises.get(normalizedName)!.id);
        });
    });

    // From history logs:
    const keys = Object.keys(localStorage).filter(k => k.startsWith('gym_log_'));
    keys.forEach(key => {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        Object.keys(data).forEach(exId => {
            if (['_day_note_', 'calories', 'duration', 'avgHeartRate', 'maxHeartRate', 'routineId'].includes(exId)) return;
            
            // If it's a historical ID not in routines, guess its name and normalize
            if (!idToCanonicalMap.has(exId)) {
                const guessedName = exId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const normalizedName = guessedName.trim().toLowerCase();
                const cleanId = normalizedName.replace(/\s+/g, '_');
                
                if (!canonicalExercises.has(normalizedName)) {
                    canonicalExercises.set(normalizedName, { id: cleanId, name: guessedName.trim() });
                }
                idToCanonicalMap.set(exId, canonicalExercises.get(normalizedName)!.id);
            }
        });
    });

    // 2. Update routineConfig
    const newConfig: RoutineConfig = {};
    let configModified = false;

    Object.values(routineConfig).forEach(r => {
        const newExercises: Exercise[] = [];
        r.exercises.forEach(ex => {
            const canonicalId = idToCanonicalMap.get(ex.id);
            if (canonicalId && (canonicalId !== ex.id || ex.name !== ex.name.trim())) {
                configModified = true;
                const canonicalData = canonicalExercises.get(ex.name.trim().toLowerCase());
                newExercises.push({
                    ...ex,
                    id: canonicalId,
                    name: canonicalData ? canonicalData.name : ex.name.trim()
                });
            } else {
                newExercises.push(ex);
            }
        });

        // Deduplicate within the same routine just in case there were literal duplicates
        const uniqueExercises: Exercise[] = [];
        const seenIds = new Set<string>();
        newExercises.forEach(ex => {
            if (!seenIds.has(ex.id)) {
                seenIds.add(ex.id);
                uniqueExercises.push(ex);
            } else {
                // If there's a duplicate in the same routine, we merge or drop it? Let's drop it but keep it marked modified
                configModified = true;
            }
        });

        newConfig[r.id] = { ...r, exercises: uniqueExercises };
    });

    if (configModified) {
        saveRoutineConfig(newConfig);
    }

    // 3. Update all historical logs
    keys.forEach(key => {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        let logModified = false;
        const newData: any = {};

        Object.keys(data).forEach(exId => {
            if (['_day_note_', 'calories', 'duration', 'avgHeartRate', 'maxHeartRate', 'routineId'].includes(exId)) {
                newData[exId] = data[exId];
                return;
            }

            const canonicalId = idToCanonicalMap.get(exId);
            if (canonicalId && canonicalId !== exId) {
                logModified = true;
                // Avoid overwriting if both existed somehow, merge keys instead
                if (newData[canonicalId]) {
                   // Merge sets
                   const existingSets = Object.keys(newData[canonicalId]).filter(k => k !== 'note');
                   const incomingSets = Object.keys(data[exId]).filter(k => k !== 'note');
                   let nextSetIdx = Math.max(0, ...existingSets.map(Number)) + 1;
                   incomingSets.forEach(s => {
                       newData[canonicalId][nextSetIdx] = data[exId][s];
                       nextSetIdx++;
                   });
                   if (data[exId].note && !newData[canonicalId].note) {
                       newData[canonicalId].note = data[exId].note;
                   }
                } else {
                    newData[canonicalId] = data[exId];
                }
            } else {
                newData[exId] = data[exId];
            }
        });

        if (logModified) {
            localStorage.setItem(key, JSON.stringify(newData));
        }
    });

    localStorage.setItem('gym_v11_4_dedup_done', 'true');
    console.log("Deep Clean Deduplication complete.");
}
