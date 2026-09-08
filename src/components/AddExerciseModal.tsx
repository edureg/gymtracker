import React, { useState } from 'react';
import { Exercise } from '../types';

interface Props {
  onClose: () => void;
  onAdd: (ex: Exercise) => void;
  exerciseBank: Exercise[];
}

export default function AddExerciseModal({ onClose, onAdd, exerciseBank }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [sets, setSets] = useState(4);
  const [hasTime, setHasTime] = useState(false);

  const handleSelectFromBank = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      setSelectedId(null);
      setName('');
      setNotes('');
      setSets(4);
      setHasTime(false);
      return;
    }
    const ex = exerciseBank.find(x => x.id === id);
    if (ex) {
      setSelectedId(ex.id);
      setName(ex.name);
      setNotes(ex.notes || '');
      setSets(ex.sets);
      setHasTime(ex.hasTime || false);
    }
  };

  const handleAdd = () => {
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
  };

  const sortedBank = [...exerciseBank].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-[400px] max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-emerald-400 mb-5">Añadir Ejercicio</h3>
        
        {sortedBank.length > 0 && (
          <div className="mb-6 p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-xl">
            <label className="block text-sm text-emerald-400 mb-2 font-semibold">Repositorio (Ejercicios Previos)</label>
            <select 
              className="w-full bg-black/50 border border-emerald-400/30 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400"
              onChange={handleSelectFromBank}
              value={selectedId || ''}
            >
              <option value="">-- Crear nuevo ejercicio --</option>
              {sortedBank.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
            <p className="text-xs text-emerald-400/70 mt-2">Selecciona un ejercicio para autocompletar y mantener su historial.</p>
          </div>
        )}
        
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
            <label className="block text-sm text-gray-400 mb-1.5">Aclaraciones (Opcional)</label>
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
