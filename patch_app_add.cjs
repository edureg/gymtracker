const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldLogic = `                 if (oldRoutine) {
                     updated.exercises.forEach(newEx => {
                         const oldEx = oldRoutine.exercises.find(e => e.id === newEx.id);
                         if (oldEx && oldEx.notes !== newEx.notes) {
                             notesChanged.set(newEx.id, newEx.notes);
                         }
                     });
                 }`;

const newLogic = `                 if (oldRoutine) {
                     updated.exercises.forEach(newEx => {
                         const oldEx = oldRoutine.exercises.find(e => e.id === newEx.id);
                         if (oldEx && oldEx.notes !== newEx.notes) {
                             notesChanged.set(newEx.id, newEx.notes);
                         } else if (!oldEx && newEx.notes) {
                             // It's a newly added exercise that has notes
                             notesChanged.set(newEx.id, newEx.notes);
                         }
                     });
                 }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync(path, code);
