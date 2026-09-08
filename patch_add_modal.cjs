const fs = require('fs');
const path = 'src/components/AddExerciseModal.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldHandleAdd = `  const handleAdd = () => {
    if (!name.trim()) {
      alert("El nombre del ejercicio es obligatorio.");
      return;
    }
    
    onAdd({
      id: selectedId || 'custom_' + Date.now(),
      name: name.trim(),
      notes: notes.trim(),
      sets,
      hasTime,
      isActive: true
    });
    onClose();
  };`;

const newHandleAdd = `  const handleAdd = () => {
    if (!name.trim()) {
      alert("El nombre del ejercicio es obligatorio.");
      return;
    }
    
    let finalId = selectedId;
    let finalNotes = notes.trim();
    
    // Auto-match by exact name if no dropdown was used
    if (!finalId) {
        const existing = exerciseBank.find(x => x.name.trim().toLowerCase() === name.trim().toLowerCase());
        if (existing) {
            finalId = existing.id;
            // Only inherit notes if they didn't type anything new
            if (!finalNotes) {
                finalNotes = existing.notes || '';
            }
        }
    }
    
    onAdd({
      id: finalId || 'custom_' + Date.now(),
      name: name.trim(),
      notes: finalNotes,
      sets,
      hasTime,
      isActive: true
    });
    onClose();
  };`;

code = code.replace(oldHandleAdd, newHandleAdd);
fs.writeFileSync(path, code);
