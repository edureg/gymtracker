import React, { useState } from 'react';
import { ChevronLeft, Plus, Trash2, PenLine, GripVertical, CheckCircle, Save, Settings } from 'lucide-react';
import { Routine, Exercise } from '../types';
import AddExerciseModal from './AddExerciseModal';
import { motion, Reorder } from 'motion/react';

interface Props {
  routine: Routine;
  exerciseBank: Exercise[];
  onUpdate: (r: Routine) => void;
  onClose: () => void;
  onDelete: () => void;
}

export default function EditRoutineView({ routine, exerciseBank, onUpdate, onClose, onDelete }: Props) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState(routine.title);

  const activeExercises = routine.exercises.filter(ex => ex.isActive !== false);

  const handleUpdateExercise = (exId: string, updates: Partial<Exercise>) => {
    const newExs = routine.exercises.map(ex => ex.id === exId ? { ...ex, ...updates } : ex);
    onUpdate({ ...routine, exercises: newExs });
  };

  const handleAddExercise = (newEx: Exercise) => {
    // If it's a custom exercise that doesn't have an ID yet, ensure it gets a unique one
    const exToAdd = {
        ...newEx,
        id: newEx.id.startsWith('custom_') ? 'ex_' + Date.now() + Math.random().toString(36).substr(2, 9) : newEx.id
    };
    onUpdate({ ...routine, exercises: [...routine.exercises, exToAdd] });
    setIsAddModalOpen(false);
  };

  const handleRemoveExercise = (exId: string) => {
      // We just deactivate instead of completely deleting to keep history intact for that exercise id
      handleUpdateExercise(exId, { isActive: false });
  };

  const handleReorder = (newActiveExs: Exercise[]) => {
      // Re-map the new active exercises order back into the full exercises list
      const inactive = routine.exercises.filter(ex => ex.isActive === false);
      onUpdate({ ...routine, exercises: [...newActiveExs, ...inactive] });
  };

  const handleDelete = () => {
      if (window.confirm('¿Estás seguro de eliminar esta rutina por completo? No podrás recuperarla.')) {
          onDelete();
      }
  };

  const handleSaveTitle = () => {
      onUpdate({ ...routine, title });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="max-w-[600px] mx-auto pb-24 px-4 pt-5"
    >
      <header className="flex justify-between items-center mb-8">
        <button onClick={onClose} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors">
          <ChevronLeft className="w-5 h-5" /> 
          <span className="font-semibold text-sm">Volver</span>
        </button>
        <div className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
           Editor de Plantilla
        </div>
        <button onClick={handleDelete} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
            <Trash2 className="w-5 h-5" />
        </button>
      </header>

      <div className="mb-6 relative">
          <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              className="w-full bg-transparent text-2xl font-bold text-white border-b border-white/20 pb-2 focus:outline-none focus:border-emerald-400 focus:bg-white/5 transition-all outline-none"
          />
          <PenLine className="absolute right-2 top-2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>

      <div className="mb-6 text-sm text-gray-400">
          Arrastra y suelta los ejercicios para reordenarlos. También puedes editar la cantidad de series y notas por defecto.
      </div>

      <Reorder.Group axis="y" values={activeExercises} onReorder={handleReorder} className="space-y-4">
          {activeExercises.map((ex) => (
              <Reorder.Item key={ex.id} value={ex}>
                  <div className="bg-slate-900/60 border border-white/10 p-4 rounded-xl flex gap-3 group">
                      <div className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100">
                          <GripVertical className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                              <h3 className="text-white font-bold truncate pr-2">{ex.name}</h3>
                              <button onClick={() => handleRemoveExercise(ex.id)} className="text-red-400/50 hover:text-red-400">
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                          
                          <input 
                              type="text" 
                              value={ex.notes || ''}
                              onChange={(e) => handleUpdateExercise(ex.id, { notes: e.target.value })}
                              placeholder="Notas del ejercicio (ej. en banco scott)..."
                              className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 mb-3 text-sm text-gray-300 focus:outline-none focus:border-emerald-400/50"
                          />

                          <div className="flex items-center gap-3">
                              <div className="text-xs text-gray-500 uppercase font-semibold">Series</div>
                              <div className="flex items-center gap-2 bg-black/50 rounded-lg p-1">
                                  <button onClick={() => handleUpdateExercise(ex.id, { sets: Math.max(1, ex.sets - 1) })} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white bg-white/5 rounded-md">-</button>
                                  <span className="w-6 text-center text-emerald-400 font-bold">{ex.sets}</span>
                                  <button onClick={() => handleUpdateExercise(ex.id, { sets: ex.sets + 1 })} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white bg-white/5 rounded-md">+</button>
                              </div>
                          </div>
                      </div>
                  </div>
              </Reorder.Item>
          ))}
      </Reorder.Group>

      {activeExercises.length === 0 && (
          <div className="text-center py-10 bg-slate-900/30 border border-dashed border-white/10 rounded-2xl mb-4">
              <p className="text-gray-500 font-medium">No hay ejercicios en esta rutina.</p>
          </div>
      )}

      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="w-full py-4 mt-4 bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-400/20 transition-all shadow-[0_0_15px_rgba(52,211,153,0.1)] hover:shadow-[0_0_20px_rgba(52,211,153,0.2)]"
      >
        <Plus className="w-5 h-5" /> Añadir Ejercicio
      </button>

      {isAddModalOpen && (
        <AddExerciseModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddExercise}
          exerciseBank={exerciseBank}
        />
      )}
    </motion.div>
  );
}
