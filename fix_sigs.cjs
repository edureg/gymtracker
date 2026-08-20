const fs = require('fs');
const path = 'src/utils/exportImport.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/export function exportRoutinesPDF\(currentRoutine: RoutineConfig\) \{/, "export function exportRoutinesPDF(currentRoutine: RoutineConfig, action: 'share' | 'download' = 'share') {");
code = code.replace(/export function exportPDF\(currentRoutine: RoutineConfig, startStr\?: string, endStr\?: string\) \{/, "export function exportPDF(currentRoutine: RoutineConfig, startStr?: string, endStr?: string, action: 'share' | 'download' = 'share') {");
code = code.replace(/export function exportCSV\(currentRoutine: RoutineConfig, startStr\?: string, endStr\?: string\) \{/, "export function exportCSV(currentRoutine: RoutineConfig, startStr?: string, endStr?: string, action: 'share' | 'download' = 'share') {");
code = code.replace(/export function exportJSON\(currentRoutine: RoutineConfig, startStr\?: string, endStr\?: string\) \{/, "export function exportJSON(currentRoutine: RoutineConfig, startStr?: string, endStr?: string, action: 'share' | 'download' = 'share') {");

code = code.replace(/processFile\(fileName, blob, \(window as any\)\.__exportAction \|\| 'share'\)/g, "processFile(fileName, blob, action)");

fs.writeFileSync(path, code);
