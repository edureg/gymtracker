import React, { useState } from 'react';
import { Exercise } from '../types';

interface Props {
  onClose: () => void;
  onAdd: (ex: Exercise) => void;
  exerciseBank: Exercise[];
  defaultSets?: number;
  supersetId?: string;
  supersetName?: string;
  activeExerciseIds?: string[];
}

export default function AddExerciseModal({
  onClose,
  onAdd,
  exerciseBank,
  defaultSets,
  supersetId,
  supersetName,
  activeExerciseIds = []
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [sets, setSets] = useState(defaultSets ?? 4);
  const [hasTime, setHasTime] = useState(false);
  const [targetWeight, setTargetWeight] = useState('');
  const [targetReps, setTargetReps] = useState('');

  const handleSelectFromBank = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      setSelectedId(null);
      setName('');
      setNotes('');
      setSets(defaultSets ?? 4);
      setHasTime(false);
      setTargetWeight('');
      setTargetReps('');
      return;
    }
    const ex = exerciseBank.find(x => x.id === id);
    if (ex) {
      setSelectedId(ex.id);
      setName(ex.name);
      setNotes(ex.notes || '');
      setSets(defaultSets ?? ex.sets);
      setHasTime(ex.hasTime || false);
      setTargetWeight(ex.targetWeight || '');
      setTargetReps(ex.targetReps || '');
    }
  };

  const handleAdd = () => {
    if (!name.trim()) {
      alert("El nombre del ejercicio es obligatorio.");
      return;
    }

    let finalId = selectedId;
    let finalNotes = notes.trim();

    if (!finalId) {
      const existing = exerciseBank.find(x => x.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (existing) {
        finalId = existing.id;
        if (!finalNotes) {
          finalNotes = existing.notes || '';
        }
      }
    }

    if (finalId && activeExerciseIds.includes(finalId)) {
      alert("Este ejercicio ya está activo en esta rutina. Si querés pasarlo a una superserie, usá el selector 'Meter en superserie...' en su tarjeta.");
      return;
    }

    onAdd({
      id: finalId || 'custom_' + Date.now(),
      name: name.trim(),
      notes: finalNotes,
      sets: Math.max(1, sets),
      hasTime,
      isActive: true,
      ...(supersetId ? { supersetId } : {}),
      ...(targetWeight.trim() ? { targetWeight: targetWeight.trim() } : {}),
      ...(targetReps.trim() ? { targetReps: targetReps.trim() } : {})
    });
    onClose();
  };

  const sortedBank = [...exerciseBank].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-[420px] max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-emerald-400 mb-1">
          {supersetName ? `Añadir a ${supersetName}` : 'Añadir Ejercicio'}
        </h3>
        {supersetName && (
          <p className="text-xs text-gray-400 mb-4">
            Se inicia con {defaultSets ?? 3} rondas sugeridas; podés ajustarle sus rondas por separado si hace menos o más que el resto.
          </p>
        )}

        {sortedBank.length > 0 && (
          <div className="mb-5 mt-3 p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-xl">
            <label className="block text-sm text-emerald-400 mb-2 font-semibold">Repositorio (Ejercicios Previos)</label>
            <select
              className="w-full bg-black/50 border border-emerald-400/30 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400 min-h-[44px]"
              onChange={handleSelectFromBank}
              value={selectedId || ''}
            >
              <option value="">-- Crear nuevo ejercicio --</option>
              {sortedBank.map(ex => {
                const alreadyActive = activeExerciseIds.includes(ex.id);
                return (
                  <option key={ex.id} value={ex.id} disabled={alreadyActive}>
                    {ex.name}{alreadyActive ? ' (Ya en rutina)' : ''}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-emerald-400/70 mt-2">Seleccioná un ejercicio para autocompletar sus notas y mantener su historial.</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Nombre del Ejercicio *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Extensión de Tríceps Polea Alta"
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Aclaraciones técnicas (Opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej. Polea alta, codos pegados al cuerpo"
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400 min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Peso objetivo kg (Opc.)</label>
              <input
                type="text"
                inputMode="decimal"
                value={targetWeight}
                onChange={e => setTargetWeight(e.target.value)}
                placeholder="Ej. 25"
                className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white tabular-nums focus:outline-none focus:border-emerald-400 min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Reps objetivo (Opc.)</label>
              <input
                type="text"
                value={targetReps}
                onChange={e => setTargetReps(e.target.value)}
                placeholder="Ej. 10-12"
                className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white tabular-nums focus:outline-none focus:border-emerald-400 min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              {supersetName ? 'Cantidad de Rondas / Series para este ejercicio *' : 'Cantidad de Series *'}
            </label>
            <input
              type="number"
              value={sets}
              onChange={e => setSets(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white tabular-nums focus:outline-none focus:border-emerald-400 min-h-[44px]"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer pt-1 min-h-[44px]">
            <input
              type="checkbox"
              checked={hasTime}
              onChange={e => setHasTime(e.target.checked)}
              className="w-5 h-5 accent-emerald-400"
            />
            <span className="text-gray-300 text-sm">Registrar Tiempo en este ejercicio</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-7">
          <button
            onClick={onClose}
            className="px-4 py-2.5 min-h-[44px] rounded-lg border border-gray-600 text-gray-300 hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            className="px-5 py-2.5 min-h-[44px] rounded-lg bg-emerald-400 text-black font-semibold hover:brightness-110 transition"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}
