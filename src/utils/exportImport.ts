import { RoutineConfig } from '../types';
import { DEFAULT_ROUTINE } from '../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportRoutinesPDF(currentRoutine: RoutineConfig) {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Mis Rutinas (Plantillas)", 14, 22);
    
    let currentY = 32;

    Object.values(currentRoutine).forEach(routine => {
        if (currentY > 260) {
            doc.addPage();
            currentY = 20;
        }
        
        doc.setFontSize(14);
        doc.text(routine.title, 14, currentY);
        
        const tableData = routine.exercises
            .filter(ex => ex.isActive !== false)
            .map(ex => [
                ex.name,
                ex.sets.toString(),
                ex.notes || '-'
            ]);

        autoTable(doc, {
            startY: currentY + 4,
            head: [['Ejercicio', 'Series', 'Notas']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [40, 40, 40] }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save(`plantillas_rutinas_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportPDF(currentRoutine: RoutineConfig, startStr?: string, endStr?: string) {
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
        const exKeys = Object.keys(data).filter(k => !['_day_note_', 'calories', 'duration', 'avgHeartRate', 'maxHeartRate', 'routineId'].includes(k));
        
        if (exKeys.length === 0 && !data._day_note_) return;
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

        exKeys.forEach(exId => {
            const sets = data[exId];
            let exName = exId;

            Object.values(currentRoutine).forEach(routine => {
                const foundInCurrent = routine.exercises?.find(e => e.id === exId);
                if (foundInCurrent) exName = foundInCurrent.name;
            });
            if (exName === exId) {
                Object.values(DEFAULT_ROUTINE).forEach(routine => {
                    const foundInOriginal = routine.exercises?.find(e => e.id === exId);
                    if (foundInOriginal) exName = foundInOriginal.name;
                });
            }

            const setKeys = Object.keys(sets).filter(k => k !== 'note' && k !== 'done' && (sets[k].reps || sets[k].weight || sets[k].time || sets[k].done));
            if (setKeys.length === 0 && !sets.note) return;

            // Fila del Ejercicio
            tableData.push([
                { 
                    content: `Ejercicio: ${exName}`, 
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
                    `Serie ${setIdx}`,
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
        head: [['Serie / Info', 'Reps', 'Peso', 'Tiempo', 'Hecho']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [60, 60, 60] },
        styles: { fontSize: 10 }
    });

    doc.save(`gym_export_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportCSV(currentRoutine: RoutineConfig, startStr?: string, endStr?: string) {
    let csvRows: string[] = [];
    const header = "Fecha,Ejercicio,Serie,Repeticiones,Peso (kg),Tiempo (s),Notas,Nota General,Calorías,Duración,FC Promedio,FC Máxima";

    let keys = Object.keys(localStorage)
        .filter(k => k.startsWith('gym_log_'))
        .sort((a, b) => b.localeCompare(a));

    keys.forEach(key => {
        const dateStr = key.replace('gym_log_', '');

        if (startStr && dateStr < startStr) return;
        if (endStr && dateStr > endStr) return;

        const data = JSON.parse(localStorage.getItem(key) || '{}');

        const dayNoteRaw = data._day_note_ || '';
        const dayNoteStr = dayNoteRaw.replace(/"/g, '""');
        const calories = data.calories || '';
        const duration = data.duration || '';
        const avgHeartRate = data.avgHeartRate || '';
        const maxHeartRate = data.maxHeartRate || '';

        let isFirstRowOfDay = true;

        Object.keys(data).forEach(exId => {
            if (exId === '_day_note_' || exId === 'calories' || exId === 'duration' || exId === 'avgHeartRate' || exId === 'maxHeartRate' || exId === 'routineId') return;
            const sets = data[exId];
            let exName = exId;

            Object.values(currentRoutine).forEach(routine => {
                const foundInCurrent = routine.exercises?.find(e => e.id === exId);
                if (foundInCurrent) exName = foundInCurrent.name;
            });

            // Also check default routines if not found
            if (exName === exId) {
                Object.values(DEFAULT_ROUTINE).forEach(routine => {
                    const foundInOriginal = routine.exercises?.find(e => e.id === exId);
                    if (foundInOriginal) exName = foundInOriginal.name;
                });
            }

            let isFirstRowOfExercise = true;

            Object.keys(sets).forEach(setIdx => {
                if (setIdx === 'note' || setIdx === 'done') return;
                const s = sets[setIdx];
                const noteStr = sets.note ? sets.note.replace(/"/g, '""') : '';
                if (s.reps || s.weight || s.time || s.done) {
                    const outDayNote = isFirstRowOfDay ? dayNoteStr : '';
                    const outExNote = isFirstRowOfExercise ? noteStr : '';
                    const outCal = isFirstRowOfDay ? calories : '';
                    const outDur = isFirstRowOfDay ? duration : '';
                    const outAvg = isFirstRowOfDay ? avgHeartRate : '';
                    const outMax = isFirstRowOfDay ? maxHeartRate : '';

                    csvRows.push(`${dateStr},"${exName}",${setIdx},${s.reps || 0},${s.weight || 0},${s.time || 0},"${outExNote}","${outDayNote}","${outCal}","${outDur}","${outAvg}","${outMax}"`);
                    
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

export function exportJSON(currentRoutine: RoutineConfig, startStr?: string, endStr?: string) {
    const dataToExport: any = {
        version: "v11.7",
        routine: currentRoutine,
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
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `gym_export_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function importFile(file: File, currentRoutine: RoutineConfig, onComplete: (newConfig?: RoutineConfig) => void) {
    if (file.name.endsWith('.json') || (file.name.endsWith('.txt') && file.type.includes('json'))) {
        importJSON(file, currentRoutine, onComplete);
    } else if (file.name.endsWith('.csv')) {
        importCSV(file, currentRoutine, onComplete);
    } else {
        // Fallback or guess by reading first few characters
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content && content.trim().startsWith('{')) {
                importJSON(file, currentRoutine, onComplete);
            } else {
                importCSV(file, currentRoutine, onComplete);
            }
        };
        reader.readAsText(file.slice(0, 10)); // just read first 10 bytes to guess
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
            if (parsed.routine) {
                newConfig = parsed.routine;
                localStorage.setItem('gym_routine_config', JSON.stringify(newConfig));
            }

            alert(`¡Importación JSON finalizada! Se restauraron ${logsCount} días de historial${newConfig ? ' y la configuración de tu rutina' : ''}.`);
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
                const calories = matchArray.length >= 9 ? matchArray[8] : '';
                const duration = matchArray.length >= 10 ? matchArray[9] : '';
                const avgHeartRate = matchArray.length >= 11 ? matchArray[10] : '';
                const maxHeartRate = matchArray.length >= 12 ? matchArray[11] : '';

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
