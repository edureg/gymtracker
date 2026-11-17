import { RoutineConfig, Exercise } from '../types';
import { getMasterExercises, saveRoutineConfig } from './storage';
import { groupExercisesIntoBlocks, formatTargetSummary } from './routineBlocks';
import { DEFAULT_ROUTINE } from '../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

async function processFile(fileName: string, blob: Blob, action: 'share' | 'download') {
    if (action === 'share') {
        try {
            if (navigator.canShare) {
                const file = new File([blob], fileName, { type: blob.type });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: fileName,
                        files: [file]
                    });
                    return;
                }
            }
        } catch (error: any) {
            console.log('Share failed or was cancelled:', error);
            if (error.name === 'AbortError') return; // User explicitly cancelled
        }
    }
    
    // Fallback to download or if action === 'download'
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function escapeCSV(val: string | undefined | null): string {
    if (!val) return '""';
    return `"${String(val).replace(/"/g, '""')}"`;
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                result.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
    }
    result.push(current);
    return result;
}

function findExerciseContext(exId: string, routineId: string | undefined, currentRoutine: RoutineConfig): {
    exName: string;
    biserieName: string;
    targetSummary: string;
} {
    let matchedEx: Exercise | undefined;
    let biserieName = '';

    if (routineId && currentRoutine[routineId]) {
        const r = currentRoutine[routineId];
        matchedEx = r.exercises?.find(e => e.id === exId);
        if (matchedEx?.supersetId && r.supersets?.[matchedEx.supersetId]) {
            biserieName = r.supersets[matchedEx.supersetId].name || 'Superserie';
        }
    }

    if (!matchedEx) {
        for (const r of Object.values(currentRoutine)) {
            const found = r.exercises?.find(e => e.id === exId);
            if (found) {
                matchedEx = found;
                if (found.supersetId && r.supersets?.[found.supersetId]) {
                    biserieName = r.supersets[found.supersetId].name || 'Superserie';
                }
                break;
            }
        }
    }

    if (!matchedEx) {
        for (const r of Object.values(DEFAULT_ROUTINE)) {
            const found = r.exercises?.find(e => e.id === exId);
            if (found) {
                matchedEx = found;
                break;
            }
        }
    }

    return {
        exName: matchedEx ? matchedEx.name : exId,
        biserieName,
        targetSummary: matchedEx ? (formatTargetSummary(matchedEx) || '') : ''
    };
}

function sortExKeysByRoutine(exKeys: string[], routineId: string | undefined, currentRoutine: RoutineConfig): string[] {
    if (!routineId || !currentRoutine[routineId]?.exercises) return exKeys;
    const order = currentRoutine[routineId].exercises.map(e => e.id);
    return [...exKeys].sort((a, b) => {
        const idxA = order.indexOf(a);
        const idxB = order.indexOf(b);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });
}

export function exportRoutinesPDF(currentRoutine: RoutineConfig, action: 'share' | 'download' = 'share') {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Mis Rutinas (Plantillas)", 14, 22);
    
    let currentY = 32;

    Object.values(currentRoutine).forEach(routine => {
        if (currentY > 255) {
            doc.addPage();
            currentY = 20;
        }
        
        doc.setFontSize(14);
        doc.text(routine.title, 14, currentY);

        const activeExs = (routine.exercises || []).filter(ex => ex.isActive !== false);
        const blocks = groupExercisesIntoBlocks(activeExs, routine.supersets);
        const tableData: any[] = [];

        blocks.forEach(block => {
            if (block.type === 'superset') {
                const { superset, exercises } = block;
                const effectiveRounds = exercises.length > 0
                    ? Math.max(...exercises.map(e => Math.max(1, e.sets || 1)))
                    : Math.max(1, superset.rounds || 1);
                const roundsLabel = `Hasta ${effectiveRounds} ${effectiveRounds === 1 ? 'ronda' : 'rondas'}`;
                const headerText = `${superset.name || 'Superserie'} — ${roundsLabel}${superset.notes ? ` | ${superset.notes}` : ''}`;

                tableData.push([
                    {
                        content: headerText,
                        colSpan: 4,
                        styles: { fillColor: [230, 245, 238], textColor: [20, 83, 45], fontStyle: 'bold' }
                    }
                ]);

                exercises.forEach(ex => {
                    tableData.push([
                        `  • ${ex.name}`,
                        ex.sets.toString(),
                        formatTargetSummary(ex) || '-',
                        ex.notes || '-'
                    ]);
                });
            } else {
                const ex = block.exercise;
                tableData.push([
                    ex.name,
                    ex.sets.toString(),
                    formatTargetSummary(ex) || '-',
                    ex.notes || '-'
                ]);
            }
        });

        if (tableData.length === 0) {
            tableData.push(['Sin ejercicios activos', '-', '-', '-']);
        }

        autoTable(doc, {
            startY: currentY + 4,
            head: [['Ejercicio', 'Series / Rondas', 'Objetivo Próx. Vez', 'Notas']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 9.5 },
            headStyles: { fillColor: [40, 40, 40] },
            columnStyles: {
                0: { cellWidth: 58 },
                1: { cellWidth: 28, halign: 'center' },
                2: { cellWidth: 38 },
                3: { cellWidth: 'auto' }
            }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
    });

    const fileName = `plantillas_rutinas_${new Date().toISOString().split('T')[0]}.pdf`;
    const blob = doc.output('blob');
    processFile(fileName, blob, action);
}

export function exportPDF(currentRoutine: RoutineConfig, startStr?: string, endStr?: string, action: 'share' | 'download' = 'share') {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Reporte de Entrenamientos", 14, 22);
    
    if (startStr && endStr) {
        doc.setFontSize(12);
        doc.text(`Desde: ${startStr} - Hasta: ${endStr}`, 14, 30);
    } else if (startStr) {
        doc.setFontSize(12);
        doc.text(`Desde: ${startStr}`, 14, 30);
    }
    
    let keys = Object.keys(localStorage)
        .filter(k => k.startsWith('gym_log_'))
        .sort((a, b) => b.localeCompare(a));

    const tableData: any[] = [];
    let hasData = false;

    keys.forEach(key => {
        const dateStr = key.replace('gym_log_', '');

        if (startStr && dateStr < startStr) return;
        if (endStr && dateStr > endStr) return;

        const data = JSON.parse(localStorage.getItem(key) || '{}');
        const rawExKeys = Object.keys(data).filter(k => !['_day_note_', 'calories', 'duration', 'avgHeartRate', 'maxHeartRate', 'routineId'].includes(k));
        
        if (rawExKeys.length === 0 && !data._day_note_) return;
        hasData = true;

        let routineName = "Libre";
        if (data.routineId && currentRoutine[data.routineId]) {
            routineName = currentRoutine[data.routineId].title;
        }

        // Fila del Día
        tableData.push([
            { 
                content: (() => {
                    let metricsText = "";
                    if (data.duration) metricsText += ` | ${data.duration}`;
                    if (data.calories) metricsText += ` | ${data.calories} kcal`;
                    if (data.avgHeartRate || data.maxHeartRate) {
                        metricsText += ` | ${data.avgHeartRate || '-'}-${data.maxHeartRate || '-'} lpm`;
                    }
                    return `Fecha: ${dateStr} - Rutina: ${routineName}${metricsText}`;
                })(), 
                colSpan: 5, 
                styles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' } 
            }
        ]);

        // Fila de Comentario del Día
        if (data._day_note_) {
            tableData.push([
                { 
                    content: `Comentario del día: ${data._day_note_}`, 
                    colSpan: 5, 
                    styles: { fillColor: [240, 248, 255], textColor: [80, 80, 80], fontStyle: 'italic' } 
                }
            ]);
        }

        const exKeys = sortExKeysByRoutine(rawExKeys, data.routineId, currentRoutine);

        exKeys.forEach(exId => {
            const sets = data[exId];
            if (!sets || typeof sets !== 'object') return;
            const { exName, biserieName, targetSummary } = findExerciseContext(exId, data.routineId, currentRoutine);

            const setKeys = Object.keys(sets).filter(k => k !== 'note' && k !== 'done' && (sets[k].reps || sets[k].weight || sets[k].time || sets[k].done));
            if (setKeys.length === 0 && !sets.note) return;

            const prefix = biserieName ? `[${biserieName}] ` : '';
            const targetSuffix = targetSummary ? ` | Obj: ${targetSummary}` : '';

            // Fila del Ejercicio
            tableData.push([
                { 
                    content: `Ejercicio: ${prefix}${exName}${targetSuffix}`, 
                    colSpan: 5, 
                    styles: { fillColor: [220, 230, 240], fontStyle: 'bold', textColor: [40, 40, 40] } 
                }
            ]);

            // Fila de Nota del Ejercicio
            if (sets.note) {
                tableData.push([
                    { 
                        content: `Nota: ${sets.note}`, 
                        colSpan: 5, 
                        styles: { fillColor: [250, 250, 250], textColor: [100, 100, 100], fontStyle: 'italic' } 
                    }
                ]);
            }

            // Filas de las Series
            setKeys.forEach(setIdx => {
                const s = sets[setIdx];
                tableData.push([
                    biserieName ? `Ronda ${setIdx}` : `Serie ${setIdx}`,
                    s.reps ? `${s.reps}` : '-',
                    s.weight ? `${s.weight} kg` : '-',
                    s.time ? `${s.time} s` : '-',
                    s.done ? 'Sí' : '-'
                ]);
            });
        });
    });

    if (!hasData) {
        alert("No hay datos guardados para exportar en este rango.");
        return;
    }

    autoTable(doc, {
        startY: 35,
        head: [['Serie / Ronda', 'Reps', 'Peso', 'Tiempo', 'Hecho']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [60, 60, 60] },
        styles: { fontSize: 10 }
    });

    const fileName = `gym_export_${new Date().toISOString().split('T')[0]}.pdf`;
    const blob = doc.output('blob');
    processFile(fileName, blob, action);
}

export function exportCSV(currentRoutine: RoutineConfig, startStr?: string, endStr?: string, action: 'share' | 'download' = 'share') {
    let csvRows: string[] = [];
    const header = "Fecha,Superserie,Ejercicio,Serie,Repeticiones,Peso (kg),Tiempo (s),Objetivo,Notas,Nota General,Calorías,Duración,FC Promedio,FC Máxima";

    let keys = Object.keys(localStorage)
        .filter(k => k.startsWith('gym_log_'))
        .sort((a, b) => b.localeCompare(a));

    keys.forEach(key => {
        const dateStr = key.replace('gym_log_', '');

        if (startStr && dateStr < startStr) return;
        if (endStr && dateStr > endStr) return;

        const data = JSON.parse(localStorage.getItem(key) || '{}');

        const dayNoteRaw = data._day_note_ || '';
        const calories = data.calories || '';
        const duration = data.duration || '';
        const avgHeartRate = data.avgHeartRate || '';
        const maxHeartRate = data.maxHeartRate || '';

        let isFirstRowOfDay = true;

        const rawExKeys = Object.keys(data).filter(exId => 
            !['_day_note_', 'calories', 'duration', 'avgHeartRate', 'maxHeartRate', 'routineId'].includes(exId)
        );
        const exKeys = sortExKeysByRoutine(rawExKeys, data.routineId, currentRoutine);

        exKeys.forEach(exId => {
            const sets = data[exId];
            if (!sets || typeof sets !== 'object') return;
            const { exName, biserieName, targetSummary } = findExerciseContext(exId, data.routineId, currentRoutine);

            let isFirstRowOfExercise = true;

            Object.keys(sets).forEach(setIdx => {
                if (setIdx === 'note' || setIdx === 'done') return;
                const s = sets[setIdx];
                if (s.reps || s.weight || s.time || s.done) {
                    const outDayNote = isFirstRowOfDay ? dayNoteRaw : '';
                    const outExNote = isFirstRowOfExercise ? (sets.note || '') : '';
                    const outCal = isFirstRowOfDay ? calories : '';
                    const outDur = isFirstRowOfDay ? duration : '';
                    const outAvg = isFirstRowOfDay ? avgHeartRate : '';
                    const outMax = isFirstRowOfDay ? maxHeartRate : '';

                    csvRows.push([
                        dateStr,
                        escapeCSV(biserieName),
                        escapeCSV(exName),
                        setIdx,
                        s.reps || 0,
                        s.weight || 0,
                        s.time || 0,
                        escapeCSV(targetSummary),
                        escapeCSV(outExNote),
                        escapeCSV(outDayNote),
                        escapeCSV(outCal),
                        escapeCSV(outDur),
                        escapeCSV(outAvg),
                        escapeCSV(outMax)
                    ].join(','));
                    
                    isFirstRowOfDay = false;
                    isFirstRowOfExercise = false;
                }
            });
        });
    });

    if (csvRows.length === 0) {
        alert("No hay datos guardados para exportar.");
        return;
    }

    let csvContent = header + "\n" + csvRows.join("\n");
    
    // Append routine config (includes supersets & targets)
    csvContent += "\n---ROUTINE_CONFIG---\n";
    csvContent += JSON.stringify(currentRoutine);
    
    // Append master exercises
    csvContent += "\n---MASTER_EXERCISES---\n";
    csvContent += JSON.stringify(getMasterExercises());

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `gym_export_${new Date().toISOString().split('T')[0]}.csv`;
    processFile(fileName, blob, action);
}

export function exportJSON(currentRoutine: RoutineConfig, startStr?: string, endStr?: string, action: 'share' | 'download' = 'share') {
    const dataToExport: any = {
        version: "v12.0",
        routine: currentRoutine,
        master_exercises: getMasterExercises(),
        logs: {}
    };

    const keys = Object.keys(localStorage).filter(k => k.startsWith('gym_log_'));
    keys.forEach(key => {
        const dateStr = key.replace('gym_log_', '');
        
        if (startStr && dateStr < startStr) return;
        if (endStr && dateStr > endStr) return;

        dataToExport.logs[dateStr] = JSON.parse(localStorage.getItem(key) || '{}');
    });

    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const fileName = `gym_export_${new Date().toISOString().split('T')[0]}.json`;
    processFile(fileName, blob, action);
}

export function importFile(file: File, currentRoutine: RoutineConfig, onComplete: (newConfig?: RoutineConfig) => void) {
    if (file.name.endsWith('.json') || (file.name.endsWith('.txt') && file.type.includes('json'))) {
        importJSON(file, currentRoutine, onComplete);
    } else if (file.name.endsWith('.csv')) {
        importCSV(file, currentRoutine, onComplete);
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content && content.trim().startsWith('{')) {
                importJSON(file, currentRoutine, onComplete);
            } else {
                importCSV(file, currentRoutine, onComplete);
            }
        };
        reader.readAsText(file.slice(0, 10));
    }
}

function importJSON(file: File, currentRoutine: RoutineConfig, onComplete: (newConfig?: RoutineConfig) => void) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const text = e.target?.result as string;
            const parsed = JSON.parse(text);
            
            let logsCount = 0;
            if (parsed.logs) {
                Object.keys(parsed.logs).forEach(dateStr => {
                    localStorage.setItem(`gym_log_${dateStr}`, JSON.stringify(parsed.logs[dateStr]));
                    logsCount++;
                });
            }

            let newConfig: RoutineConfig | undefined;
            let importedMaster = false;
            
            if (parsed.routine) {
                newConfig = parsed.routine;
                saveRoutineConfig(newConfig!);
            }
            if (parsed.master_exercises) {
                localStorage.setItem('gym_master_exercises', JSON.stringify(parsed.master_exercises));
                importedMaster = true;
            }

            alert(`¡Importación JSON finalizada! Se restauraron ${logsCount} días de historial${newConfig ? ', rutinas' : ''}${importedMaster ? ' y el maestro de ejercicios' : ''}.`);
            onComplete(newConfig);
        } catch (err) {
            console.error(err);
            alert('Error al procesar el archivo JSON. Puede que esté corrupto o sea inválido.');
        }
    };
    reader.onerror = function() {
        alert('Error al leer el archivo JSON.');
    };
    reader.readAsText(file);
}

function importCSV(file: File, currentRoutine: RoutineConfig, onComplete: (newConfig?: RoutineConfig) => void) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target?.result as string;
        
        const parts = text.split("\n---ROUTINE_CONFIG---\n");
        const logsText = parts[0];
        
        let configText = null;
        let masterText = null;
        
        if (parts.length > 1) {
            const subParts = parts[1].split("\n---MASTER_EXERCISES---\n");
            configText = subParts[0];
            masterText = subParts.length > 1 ? subParts[1] : null;
        }

        const lines = logsText.split('\n');

        if (lines.length < 2) {
            alert('El archivo no parece ser un CSV válido o está vacío.');
            return;
        }

        const headerLine = lines[0] || '';
        const hasBiserieFormat = (headerLine.includes('Superserie') || headerLine.includes('Biserie')) && headerLine.includes('Objetivo');

        let importedCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const matchArray = parseCSVLine(line);

            if (matchArray.length >= 5) {
                const dateStr = matchArray[0];
                const exName = hasBiserieFormat ? matchArray[2] : matchArray[1];
                const setIdx = parseInt(hasBiserieFormat ? matchArray[3] : matchArray[2]);
                const reps = parseInt(hasBiserieFormat ? matchArray[4] : matchArray[3]);
                const weight = parseFloat(hasBiserieFormat ? matchArray[5] : matchArray[4]);
                const time = hasBiserieFormat
                    ? (matchArray.length >= 7 ? parseInt(matchArray[6]) : 0)
                    : (matchArray.length >= 6 ? parseInt(matchArray[5]) : 0);
                const note = hasBiserieFormat
                    ? (matchArray.length >= 9 ? matchArray[8] : '')
                    : (matchArray.length >= 7 ? matchArray[6] : '');
                const dayNote = hasBiserieFormat
                    ? (matchArray.length >= 10 ? matchArray[9] : '')
                    : (matchArray.length >= 8 ? matchArray[7] : '');
                const calories = hasBiserieFormat
                    ? (matchArray.length >= 11 ? matchArray[10] : '')
                    : (matchArray.length >= 9 ? matchArray[8] : '');
                const duration = hasBiserieFormat
                    ? (matchArray.length >= 12 ? matchArray[11] : '')
                    : (matchArray.length >= 10 ? matchArray[9] : '');
                const avgHeartRate = hasBiserieFormat
                    ? (matchArray.length >= 13 ? matchArray[12] : '')
                    : (matchArray.length >= 11 ? matchArray[10] : '');
                const maxHeartRate = hasBiserieFormat
                    ? (matchArray.length >= 14 ? matchArray[13] : '')
                    : (matchArray.length >= 12 ? matchArray[11] : '');

                if (!dateStr || !exName || isNaN(setIdx)) continue;

                let exId: string | null = null;
                Object.values(currentRoutine).forEach(routine => {
                    const found = routine.exercises?.find(ex => ex.name === exName);
                    if (found) exId = found.id;
                });

                if (!exId) {
                    Object.values(DEFAULT_ROUTINE).forEach(routine => {
                        const found = routine.exercises?.find(ex => ex.name === exName);
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
                if (calories && !data.calories) data.calories = calories;
                if (duration && !data.duration) data.duration = duration;
                if (avgHeartRate && !data.avgHeartRate) data.avgHeartRate = avgHeartRate;
                if (maxHeartRate && !data.maxHeartRate) data.maxHeartRate = maxHeartRate;

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
                saveRoutineConfig(newConfig!);
            } catch (err) {
                console.warn("No se pudo parsear la configuración de la rutina", err);
            }
        }

        if (masterText) {
            try {
                const parsedMaster = JSON.parse(masterText.trim());
                localStorage.setItem('gym_master_exercises', JSON.stringify(parsedMaster));
            } catch (err) {
                console.warn("No se pudo parsear el maestro de ejercicios", err);
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

export function exportMasterDict(currentRoutine: RoutineConfig, action: 'share' | 'download' = 'share') {
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

    const fileName = `maestro_ejercicios_${new Date().toISOString().split('T')[0]}.pdf`;
    const blob = doc.output('blob');
    processFile(fileName, blob, action);
}
