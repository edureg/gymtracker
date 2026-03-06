import { RoutineConfig } from '../types';
import { DEFAULT_ROUTINE } from '../constants';

export function exportCSV(currentRoutine: RoutineConfig) {
    let csvRows: string[] = [];
    const header = "Fecha,Ejercicio,Serie,Repeticiones,Peso (kg),Tiempo (s),Notas,Nota General";

    const keys = Object.keys(localStorage)
        .filter(k => k.startsWith('gym_log_'))
        .sort();

    keys.forEach(key => {
        const dateStr = key.replace('gym_log_', '');
        const data = JSON.parse(localStorage.getItem(key) || '{}');

        const dayNoteRaw = data._day_note_ || '';
        const dayNoteStr = dayNoteRaw.replace(/"/g, '""');

        Object.keys(data).forEach(exId => {
            if (exId === '_day_note_') return;
            const sets = data[exId];
            let exName = exId;

            [0, 1, 2, 3, 4, 5, 6].forEach(d => {
                const foundInCurrent = currentRoutine[d]?.exercises?.find(e => e.id === exId);
                const foundInOriginal = DEFAULT_ROUTINE[d] ? DEFAULT_ROUTINE[d].exercises?.find(e => e.id === exId) : null;
                if (foundInCurrent) exName = foundInCurrent.name;
                else if (foundInOriginal && exName === exId) exName = foundInOriginal.name;
            });

            Object.keys(sets).forEach(setIdx => {
                if (setIdx === 'note' || setIdx === 'done') return;
                const s = sets[setIdx];
                const noteStr = sets.note ? sets.note.replace(/"/g, '""') : '';
                if (s.reps || s.weight || s.time || s.done) {
                    csvRows.push(`${dateStr},"${exName}",${setIdx},${s.reps || 0},${s.weight || 0},${s.time || 0},"${noteStr}","${dayNoteStr}"`);
                }
            });
        });
    });

    if (csvRows.length === 0) {
        alert("No hay datos guardados para exportar.");
        return;
    }

    let csvContent = header + "\n" + csvRows.join("\n");
    
    // Append routine config
    csvContent += "\n---ROUTINE_CONFIG---\n";
    csvContent += JSON.stringify(currentRoutine);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `gym_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function importCSV(file: File, currentRoutine: RoutineConfig, onComplete: (newConfig?: RoutineConfig) => void) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target?.result as string;
        
        // Split text to separate logs from config
        const parts = text.split("\n---ROUTINE_CONFIG---\n");
        const logsText = parts[0];
        const configText = parts.length > 1 ? parts[1] : null;

        const lines = logsText.split('\n');

        if (lines.length < 2) {
            alert('El archivo no parece ser un CSV válido o está vacío.');
            return;
        }

        let importedCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
            let matchArray: string[] = line.match(regex) || line.split(',');

            matchArray = matchArray.map(m => m.replace(/^"|"$/g, ''));

            if (matchArray.length >= 5) {
                const dateStr = matchArray[0];
                const exName = matchArray[1];
                const setIdx = parseInt(matchArray[2]);
                const reps = parseInt(matchArray[3]);
                const weight = parseFloat(matchArray[4]);
                const time = matchArray.length >= 6 ? parseInt(matchArray[5]) : 0;
                const note = matchArray.length >= 7 ? matchArray[6] : '';
                const dayNote = matchArray.length >= 8 ? matchArray[7] : '';

                let exId: string | null = null;
                [0, 1, 2, 3, 4, 5, 6].forEach(d => {
                    const found = currentRoutine[d]?.exercises?.find(ex => ex.name === exName);
                    if (found) exId = found.id;
                });

                if (!exId) {
                    [1, 3, 5].forEach(d => {
                        const found = DEFAULT_ROUTINE[d]?.exercises?.find(ex => ex.name === exName);
                        if (found) exId = found.id;
                    });
                }

                if (!exId) {
                    exId = exName.toLowerCase().replace(/[^a-z0-9]/g, '_');
                }

                const storageKey = `gym_log_${dateStr}`;
                const data = JSON.parse(localStorage.getItem(storageKey) || '{}');

                if (!data[exId]) data[exId] = {};
                if (!data[exId][setIdx]) data[exId][setIdx] = {};

                const existing = data[exId][setIdx] || {};

                if (dayNote && !data._day_note_) {
                    data._day_note_ = dayNote;
                }

                if (!existing.reps && !existing.weight && !existing.time && !existing.done) {
                    data[exId][setIdx] = {
                        reps: reps || '',
                        weight: weight || '',
                        time: time || '',
                        done: (reps > 0 || weight > 0 || time > 0)
                    };
                    if (note) data[exId].note = note;
                    localStorage.setItem(storageKey, JSON.stringify(data));
                    importedCount++;
                }
            }
        }

        let newConfig: RoutineConfig | undefined;
        if (configText) {
            try {
                newConfig = JSON.parse(configText.trim());
                localStorage.setItem('gym_routine_config', JSON.stringify(newConfig));
            } catch (err) {
                console.warn("No se pudo parsear la configuración de la rutina", err);
            }
        }

        alert(`¡Importación finalizada! Se restauraron o añadieron ${importedCount} series al historial${newConfig ? ' y se restauró la configuración de tu rutina' : ''}.`);
        onComplete(newConfig);
    };

    reader.onerror = function () {
        alert('Error al leer el archivo.');
    };

    reader.readAsText(file);
}
