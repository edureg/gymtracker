import React, { useState } from 'react';
import { Exercise } from '../types';

interface Props {
  onClose: () => void;
  onAdd: (ex: Exercise) => void;
}

export default function AddExerciseModal({ onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [sets, setSets] = useState(4);
  const [hasTime, setHasTime] = useState(false);

  const handleAdd = () => {
    if (!name.trim()) {
      alert("El nombre del ejercicio es obligatorio.");
      return;
    }
    
    onAdd({
      id: 'custom_' + Date.now(),
      name: name.trim(),
      notes: notes.trim(),
      sets,
      hasTime,
      isActive: true
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-[400px]">
        <h3 className="text-xl font-semibold text-emerald-400 mb-5">Añadir Nuevo Ejercicio</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Nombre del Ejercicio *</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Sentadillas"
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Observaciones (Opcional)</label>
            <input 
              type="text" 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej. 4 series de 10 reps. Bajando lento."
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Cantidad de Series *</label>
            <input 
              type="number" 
              value={sets}
              onChange={e => setSets(parseInt(e.target.value) || 1)}
              min="1"
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400"
            />
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer pt-2">
            <input 
              type="checkbox" 
              checked={hasTime}
              onChange={e => setHasTime(e.target.checked)}
              className="w-5 h-5 accent-emerald-400"
            />
            <span className="text-gray-300">Registrar Tiempo en este ejercicio</span>
          </label>
        </div>
        
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-500 text-gray-400 hover:bg-white/5">
            Cancelar
          </button>
          <button onClick={handleAdd} className="px-4 py-2 rounded-lg bg-emerald-400 text-black font-semibold hover:brightness-110">
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}
