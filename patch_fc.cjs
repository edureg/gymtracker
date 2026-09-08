const fs = require('fs');

const pathApp = 'src/App.tsx';
let codeApp = fs.readFileSync(pathApp, 'utf8');
codeApp = codeApp.replace(/function SortableRoutineItem\(\{ routine, onEdit, onStart \}: \{ routine: Routine, onEdit: \(\) => void, onStart: \(\) => void \}\)/,
"const SortableRoutineItem: React.FC<{ routine: Routine, onEdit: () => void, onStart: () => void }> = ({ routine, onEdit, onStart }) =>");
fs.writeFileSync(pathApp, codeApp);

const pathEdit = 'src/components/EditRoutineView.tsx';
let codeEdit = fs.readFileSync(pathEdit, 'utf8');
codeEdit = codeEdit.replace(/function SortableExerciseItem\(\{ ex, onRemove, onUpdate \}: \{ ex: Exercise, onRemove: \(id: string\) => void, onUpdate: \(id: string, updates: Partial<Exercise>\) => void \}\)/,
"const SortableExerciseItem: React.FC<{ ex: Exercise, onRemove: (id: string) => void, onUpdate: (id: string, updates: Partial<Exercise>) => void }> = ({ ex, onRemove, onUpdate }) =>");
fs.writeFileSync(pathEdit, codeEdit);
