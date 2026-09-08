import React, { useState } from 'react';
import { MasterExercise } from '../utils/storage';
import { RoutineConfig } from '../types';
import { Trash2, X, Info } from 'lucide-react';

interface Props {
  masterDict: Record<string, MasterExercise>;
  routineConfig: RoutineConfig;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, name: string, notes: string) => void;
}

export default function MasterManagerModal({ masterDict, routineConfig, onClose, onDelete, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const sortedExercises = Object.values(masterDict).sort((a, b) => a.name.localeCompare(b.name));

  const handleDelete = (exId: string, exName: string) => {
    // Check if active in any routine
    const activeRoutines = Object.values(routineConfig).filter(r => 
        r.exercises?.some(ex => ex.id === exId && ex.isActive !== false)
    );

    if (activeRoutines.length > 0) {
        const routineNames = activeRoutines.map(r => r.title).join(', ');
        alert(`⚠️ No podés borrar "${exName}" porque está activo en: ${routineNames}. Por favor, quitalo de esas rutinas primero.`);
        return;
    }

    if (confirm(`¿Seguro que querés borrar "${exName}" del Maestro? Tu historial anterior se mantendrá intacto.`)) {
        onDelete(exId);
    }
  };

  const startEdit = (m: MasterExercise) => {
      setEditingId(m.id);
      setEditName(m.name);
      setEditNotes(m.notes);
  };

  const saveEdit = () => {
      if (editingId && editName.trim()) {
          onUpdate(editingId, editName.trim(), editNotes.trim());
          setEditingId(null);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-emerald-900/20">
        
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/80 sticky top-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Maestro de Ejercicios
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Administrá tus ejercicios y aclaraciones.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
            <div className="flex flex-col gap-3">
                {sortedExercises.map(m => {
                    const activeIn = Object.values(routineConfig)
                        .filter(r => r.exercises?.some(ex => ex.id === m.id && ex.isActive !== false))
                        .map(r => r.title);

                    if (editingId === m.id) {
                        return (
                            <div key={m.id} className="bg-black/40 border border-emerald-500/50 rounded-xl p-4 space-y-3">
                                <input 
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/20 rounded-lg p-2 text-white font-bold"
                                    placeholder="Nombre del Ejercicio"
                                />
                                <textarea 
                                    value={editNotes}
                                    onChange={e => setEditNotes(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/20 rounded-lg p-2 text-sm text-gray-300"
                                    placeholder="Aclaraciones técnicas..."
                                    rows={2}
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-gray-400 hover:bg-white/10 rounded-lg">Cancelar</button>
                                    <button onClick={saveEdit} className="px-3 py-1.5 text-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30">Guardar</button>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={m.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-4 hover:border-white/20 transition group">
                            <div className="flex-1 min-w-0" onClick={() => startEdit(m)}>
                                <h3 className="font-bold text-white text-lg flex items-center gap-2 cursor-pointer group-hover:text-emerald-400 transition">
                                    {m.name}
                                </h3>
                                {m.notes && <p className="text-sm text-gray-400 mt-1 cursor-pointer">{m.notes}</p>}
                                
                                {activeIn.length > 0 && (
                                    <div className="flex items-center gap-1.5 mt-3 text-xs text-blue-400 bg-blue-400/10 inline-flex px-2 py-1 rounded-md">
                                        <Info className="w-3 h-3" /> Activo en: {activeIn.join(', ')}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-start">
                                <button onClick={() => handleDelete(m.id, m.name)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition" title="Eliminar">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {sortedExercises.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No hay ejercicios en el Maestro.
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
