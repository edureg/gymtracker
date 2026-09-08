const fs = require('fs');
const path = 'src/utils/exportImport.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace exportCSV routine config appending
const oldCSVExport = `    let csvContent = header + "\\n" + csvRows.join("\\n");
    
    // Append routine config
    csvContent += "\\n---ROUTINE_CONFIG---\\n";
    csvContent += JSON.stringify(currentRoutine);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });`;

const newCSVExport = `    let csvContent = header + "\\n" + csvRows.join("\\n");
    
    // Append routine config
    csvContent += "\\n---ROUTINE_CONFIG---\\n";
    csvContent += JSON.stringify(currentRoutine);
    
    // Append master exercises
    csvContent += "\\n---MASTER_EXERCISES---\\n";
    csvContent += JSON.stringify(getMasterExercises());

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });`;

code = code.replace(oldCSVExport, newCSVExport);

// Replace importCSV parsing
const oldCSVImport = `        // Split text to separate logs from config
        const parts = text.split("\\n---ROUTINE_CONFIG---\\n");
        const logsText = parts[0];
        const configText = parts.length > 1 ? parts[1] : null;

        const lines = logsText.split('\\n');`;

const newCSVImport = `        // Split text to separate logs from config
        const parts = text.split("\\n---ROUTINE_CONFIG---\\n");
        const logsText = parts[0];
        
        let configText = null;
        let masterText = null;
        
        if (parts.length > 1) {
            const subParts = parts[1].split("\\n---MASTER_EXERCISES---\\n");
            configText = subParts[0];
            masterText = subParts.length > 1 ? subParts[1] : null;
        }

        const lines = logsText.split('\\n');`;

code = code.replace(oldCSVImport, newCSVImport);

const oldCSVImportComplete = `            let newConfig: RoutineConfig | undefined;
            if (configText) {
                try {
                    newConfig = JSON.parse(configText);
                    localStorage.setItem('gym_routine_config', JSON.stringify(newConfig));
                } catch (e) {
                    console.error("Error parsing routine config from CSV", e);
                }
            }

            alert(\`¡Importación CSV finalizada! Se restauraron \${importedCount} series\${newConfig ? ' y la configuración de tu rutina' : ''}.\`);`;

const newCSVImportComplete = `            let newConfig: RoutineConfig | undefined;
            let importedMaster = false;
            if (configText) {
                try {
                    newConfig = JSON.parse(configText);
                    localStorage.setItem('gym_routine_config', JSON.stringify(newConfig));
                } catch (e) {
                    console.error("Error parsing routine config from CSV", e);
                }
            }
            if (masterText) {
                try {
                    const masterDict = JSON.parse(masterText);
                    localStorage.setItem('gym_master_exercises', JSON.stringify(masterDict));
                    importedMaster = true;
                } catch (e) {
                    console.error("Error parsing master dict from CSV", e);
                }
            }

            alert(\`¡Importación CSV finalizada! Se restauraron \${importedCount} series\${newConfig ? ', rutinas' : ''}\${importedMaster ? ' y el maestro de ejercicios' : ''}.\`);`;

code = code.replace(oldCSVImportComplete, newCSVImportComplete);

// Replace exportJSON
const oldJSONExport = `    const dataToExport: any = {
        version: "v11.10",
        routine: currentRoutine,
        logs: {}
    };`;

const newJSONExport = `    const dataToExport: any = {
        version: "v11.12",
        routine: currentRoutine,
        master_exercises: getMasterExercises(),
        logs: {}
    };`;

code = code.replace(oldJSONExport, newJSONExport);

// Replace importJSON
const oldJSONImport = `            let newConfig: RoutineConfig | undefined;
            if (parsed.routine) {
                newConfig = parsed.routine;
                localStorage.setItem('gym_routine_config', JSON.stringify(newConfig));
            }

            alert(\`¡Importación JSON finalizada! Se restauraron \${logsCount} días de historial\${newConfig ? ' y la configuración de tu rutina' : ''}.\`);`;

const newJSONImport = `            let newConfig: RoutineConfig | undefined;
            let importedMaster = false;
            
            if (parsed.routine) {
                newConfig = parsed.routine;
                localStorage.setItem('gym_routine_config', JSON.stringify(newConfig));
            }
            if (parsed.master_exercises) {
                localStorage.setItem('gym_master_exercises', JSON.stringify(parsed.master_exercises));
                importedMaster = true;
            }

            alert(\`¡Importación JSON finalizada! Se restauraron \${logsCount} días de historial\${newConfig ? ', rutinas' : ''}\${importedMaster ? ' y el maestro de ejercicios' : ''}.\`);`;

code = code.replace(oldJSONImport, newJSONImport);

// Update version across export files
code = code.replace(/Version 11\.11/g, 'Version 11.12');
code = code.replace(/Version 11\.10/g, 'Version 11.12'); // just in case

fs.writeFileSync(path, code);
