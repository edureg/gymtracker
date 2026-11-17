import React, { useState } from 'react';
import {
  ChevronLeft,
  Plus,
  Trash2,
  PenLine,
  GripVertical,
  Layers,
  Unlink,
  ArrowUp,
  ArrowDown,
  Target,
  X
} from 'lucide-react';
import { Routine, Exercise, SupersetGroup } from '../types';
import { RoutineBlock, groupExercisesIntoBlocks } from '../utils/routineBlocks';
import AddExerciseModal from './AddExerciseModal';
import { motion, Reorder, useDragControls } from 'motion/react';

interface Props {
  routine: Routine;
  exerciseBank: Exercise[];
  onUpdate: (r: Routine) => void;
  onClose: () => void;
  onDelete: () => void;
}

interface SortableSingleProps {
  block: { type: 'single'; exercise: Exercise };
  supersetsList: SupersetGroup[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Exercise>) => void;
  onMoveToSuperset: (exId: string, supersetId: string) => void;
}

const SortableSingleItem: React.FC<SortableSingleProps> = ({
  block,
  supersetsList,
  onRemove,
  onUpdate,
  onMoveToSuperset
}) => {
  const controls = useDragControls();
  const ex = block.exercise;

  return (
    <Reorder.Item value={block} dragListener={false} dragControls={controls}>
      <div className="bg-slate-900/60 border border-white/10 p-4 rounded-xl flex gap-3 group">
        <div
          onPointerDown={(e) => controls.start(e)}
          className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 p-2 touch-none min-w-[40px]"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>

        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-white font-bold truncate pr-2">{ex.name}</h3>
            <button
              onClick={() => onRemove(ex.id)}
              className="text-red-400/60 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
              title="Quitar ejercicio de esta rutina"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            value={ex.notes || ''}
            onChange={(e) => onUpdate(ex.id, { notes: e.target.value })}
            placeholder="Notas del ejercicio (ej. en banco scott)..."
            className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-gray-300 focus:outline-none focus:border-emerald-400/50"
          />

          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={ex.targetWeight || ''}
                onChange={(e) => onUpdate(ex.id, { targetWeight: e.target.value })}
                placeholder="Peso obj. (kg)"
                className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-amber-200 placeholder:text-gray-500 tabular-nums focus:outline-none focus:border-amber-400/50"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                value={ex.targetReps || ''}
                onChange={(e) => onUpdate(ex.id, { targetReps: e.target.value })}
                placeholder="Reps obj. (ej. 10-12)"
                className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-amber-200 placeholder:text-gray-500 tabular-nums focus:outline-none focus:border-amber-400/50"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500 uppercase font-semibold">Series</div>
              <div className="flex items-center gap-2 bg-black/50 rounded-lg p-1">
                <button
                  onClick={() => onUpdate(ex.id, { sets: Math.max(1, ex.sets - 1) })}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white bg-white/5 rounded-md"
                >
                  -
                </button>
                <span className="w-6 text-center text-emerald-400 font-bold tabular-nums">{ex.sets}</span>
                <button
                  onClick={() => onUpdate(ex.id, { sets: ex.sets + 1 })}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white bg-white/5 rounded-md"
                >
                  +
                </button>
              </div>
            </div>

            {supersetsList.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) onMoveToSuperset(ex.id, e.target.value);
                }}
                className="bg-black/40 border border-emerald-400/25 text-emerald-400 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="">Meter en biserie...</option>
                {supersetsList.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.name} ({s.rounds} rondas)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
};

interface SortableSupersetProps {
  block: { type: 'superset'; superset: SupersetGroup; exercises: Exercise[] };
  onUpdateSuperset: (supersetId: string, updates: Partial<SupersetGroup>) => void;
  onUngroupSuperset: (supersetId: string) => void;
  onDeleteSuperset: (supersetId: string) => void;
  onUpdateExercise: (exId: string, updates: Partial<Exercise>) => void;
  onRemoveExercise: (exId: string) => void;
  onDetachExercise: (exId: string) => void;
  onReorderMember: (supersetId: string, exId: string, direction: -1 | 1) => void;
  onOpenAddExerciseToSuperset: (superset: SupersetGroup) => void;
}

const SortableSupersetItem: React.FC<SortableSupersetProps> = ({
  block,
  onUpdateSuperset,
  onUngroupSuperset,
  onDeleteSuperset,
  onUpdateExercise,
  onRemoveExercise,
  onDetachExercise,
  onReorderMember,
  onOpenAddExerciseToSuperset
}) => {
  const controls = useDragControls();
  const { superset, exercises } = block;

  return (
    <Reorder.Item value={block} dragListener={false} dragControls={controls}>
      <div className="bg-slate-900/80 border border-emerald-400/30 p-4 rounded-2xl space-y-4">
        {/* Cabecera Biserie */}
        <div className="flex items-start gap-2.5">
          <div
            onPointerDown={(e) => controls.start(e)}
            className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing opacity-60 hover:opacity-100 p-2 touch-none min-w-[40px] mt-1"
            title="Arrastrar biserie completa"
          >
            <GripVertical className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="flex-1 min-w-0 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                <input
                  type="text"
                  value={superset.name}
                  onChange={(e) => onUpdateSuperset(superset.id, { name: e.target.value })}
                  placeholder="Ej. Biserie 1"
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-2.5 text-emerald-300 font-bold text-base focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onUngroupSuperset(superset.id)}
                  className="p-2 text-gray-400 hover:text-amber-300 hover:bg-white/5 rounded-lg transition-colors"
                  title="Desagrupar biserie (dejar ejercicios sueltos)"
                >
                  <Unlink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteSuperset(superset.id)}
                  className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Eliminar biserie"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <textarea
              value={superset.notes || ''}
              onChange={(e) => onUpdateSuperset(superset.id, { notes: e.target.value })}
              placeholder="Notas de la biserie (ej. 3 rondas en la misma torre, pausa 60-90 s al terminar el par)..."
              rows={2}
              className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-gray-300 focus:outline-none focus:border-emerald-400/50 resize-y"
            />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="text-xs text-emerald-400/80 uppercase font-semibold">Rondas</div>
                <div className="flex items-center gap-2 bg-black/50 rounded-lg p-1">
                  <button
                    onClick={() => onUpdateSuperset(superset.id, { rounds: Math.max(1, superset.rounds - 1) })}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white bg-white/5 rounded-md"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-emerald-400 font-bold tabular-nums">{superset.rounds}</span>
                  <button
                    onClick={() => onUpdateSuperset(superset.id, { rounds: superset.rounds + 1 })}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white bg-white/5 rounded-md"
                  >
                    +
                  </button>
                </div>
              </div>
              <span className="text-xs text-gray-400 tabular-nums">
                {exercises.length} {exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
              </span>
            </div>
          </div>
        </div>

        {/* Lista de ejercicios dentro de la biserie */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          {exercises.map((ex, idx) => (
            <div key={ex.id} className="bg-black/35 border border-white/10 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-white text-sm truncate">
                  <span className="text-emerald-400 mr-1.5">{idx + 1}.</span>
                  {ex.name}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onReorderMember(superset.id, ex.id, -1)}
                    disabled={idx === 0}
                    className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"
                    title="Subir en la biserie"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onReorderMember(superset.id, ex.id, 1)}
                    disabled={idx === exercises.length - 1}
                    className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"
                    title="Bajar en la biserie"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDetachExercise(ex.id)}
                    className="p-1.5 text-gray-400 hover:text-amber-300"
                    title="Sacar de la biserie (dejar suelto)"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveExercise(ex.id)}
                    className="p-1.5 text-red-400/60 hover:text-red-400"
                    title="Quitar ejercicio de la rutina"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={ex.notes || ''}
                onChange={(e) => onUpdateExercise(ex.id, { notes: e.target.value })}
                placeholder="Aclaración técnica del ejercicio..."
                className="w-full bg-slate-900/70 border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-gray-300 focus:outline-none focus:border-emerald-400/50"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={ex.targetWeight || ''}
                  onChange={(e) => onUpdateExercise(ex.id, { targetWeight: e.target.value })}
                  placeholder="Peso obj. (kg)"
                  className="w-full bg-slate-900/70 border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-amber-200 placeholder:text-gray-500 tabular-nums focus:outline-none focus:border-amber-400/50"
                />
                <input
                  type="text"
                  value={ex.targetReps || ''}
                  onChange={(e) => onUpdateExercise(ex.id, { targetReps: e.target.value })}
                  placeholder="Reps obj. (ej. 10-12)"
                  className="w-full bg-slate-900/70 border border-white/10 rounded-lg py-1.5 px-2.5 text-xs text-amber-200 placeholder:text-gray-500 tabular-nums focus:outline-none focus:border-amber-400/50"
                />
              </div>
            </div>
          ))}

          {exercises.length < 2 && (
            <p className="text-xs text-amber-300/80 px-1">
              Agregá al menos 2 ejercicios para completar esta biserie.
            </p>
          )}

          <button
            onClick={() => onOpenAddExerciseToSuperset(superset)}
            className="w-full py-2.5 min-h-[44px] bg-emerald-400/10 text-emerald-400 border border-emerald-400/25 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Agregar ejercicio a {superset.name || 'Biserie'}
          </button>
        </div>
      </div>
    </Reorder.Item>
  );
};

export default function EditRoutineView({ routine, exerciseBank, onUpdate, onClose, onDelete }: Props) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetSupersetForAdd, setTargetSupersetForAdd] = useState<SupersetGroup | null>(null);
  const [isAddBiserieModalOpen, setIsAddBiserieModalOpen] = useState(false);
  const [newBiserieName, setNewBiserieName] = useState('');
  const [newBiserieRounds, setNewBiserieRounds] = useState(3);
  const [newBiserieNotes, setNewBiserieNotes] = useState('');

  const [title, setTitle] = useState(routine.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const activeExercises = routine.exercises.filter(ex => ex.isActive !== false);
  const inactiveExercises = routine.exercises.filter(ex => ex.isActive === false);
  const supersetsMap = routine.supersets || {};
  const supersetsList = Object.values(supersetsMap);

  // Build blocks including any newly created empty superset so user can populate it
  const populatedBlocks = groupExercisesIntoBlocks(activeExercises, supersetsMap);
  const presentSupersetIds = new Set(
    populatedBlocks
      .filter((b): b is { type: 'superset'; superset: SupersetGroup; exercises: Exercise[] } => b.type === 'superset')
      .map(b => b.superset.id)
  );
  const emptySupersetBlocks: RoutineBlock[] = supersetsList
    .filter(s => !presentSupersetIds.has(s.id))
    .map(s => ({ type: 'superset', superset: s, exercises: [] }));
  const blocks: RoutineBlock[] = [...populatedBlocks, ...emptySupersetBlocks];

  const handleUpdateExercise = (exId: string, updates: Partial<Exercise>) => {
    const newExs = routine.exercises.map(ex => ex.id === exId ? { ...ex, ...updates } : ex);
    onUpdate({ ...routine, exercises: newExs });
  };

  const handleAddExercise = (newEx: Exercise) => {
    const existingIdx = routine.exercises.findIndex(e => e.id === newEx.id);
    let updatedExercises: Exercise[];

    if (existingIdx >= 0) {
      // Reactivate or update existing entry cleanly
      updatedExercises = routine.exercises.map((ex, i) =>
        i === existingIdx ? { ...newEx, isActive: true } : ex
      );
    } else if (newEx.supersetId) {
      // Insert right after the last exercise of that superset
      let insertAt = -1;
      routine.exercises.forEach((ex, i) => {
        if (ex.supersetId === newEx.supersetId && ex.isActive !== false) {
          insertAt = i;
        }
      });
      if (insertAt >= 0) {
        updatedExercises = [
          ...routine.exercises.slice(0, insertAt + 1),
          newEx,
          ...routine.exercises.slice(insertAt + 1)
        ];
      } else {
        updatedExercises = [...routine.exercises, newEx];
      }
    } else {
      updatedExercises = [...routine.exercises, newEx];
    }

    onUpdate({ ...routine, exercises: updatedExercises });
    setIsAddModalOpen(false);
    setTargetSupersetForAdd(null);
  };

  const handleRemoveExercise = (exId: string) => {
    // Deactivate instead of hard-deleting to keep historical logs intact
    const newExs = routine.exercises.map(ex => {
      if (ex.id === exId) {
        const copy = { ...ex, isActive: false };
        delete copy.supersetId;
        return copy;
      }
      return ex;
    });
    onUpdate({ ...routine, exercises: newExs });
  };

  const handleDetachExercise = (exId: string) => {
    const target = routine.exercises.find(e => e.id === exId);
    if (!target || !target.supersetId) return;
    const sId = target.supersetId;

    // Remove supersetId and move it right after the superset block so blocks stay contiguous
    const withoutTarget = routine.exercises.filter(e => e.id !== exId);
    let lastSupersetIdx = -1;
    withoutTarget.forEach((e, i) => {
      if (e.supersetId === sId && e.isActive !== false) {
        lastSupersetIdx = i;
      }
    });

    const detachedEx: Exercise = { ...target };
    delete detachedEx.supersetId;

    const newExercises = lastSupersetIdx >= 0
      ? [
          ...withoutTarget.slice(0, lastSupersetIdx + 1),
          detachedEx,
          ...withoutTarget.slice(lastSupersetIdx + 1)
        ]
      : [...withoutTarget, detachedEx];

    onUpdate({ ...routine, exercises: newExercises });
  };

  const handleMoveToSuperset = (exId: string, supersetId: string) => {
    const superset = supersetsMap[supersetId];
    const target = routine.exercises.find(e => e.id === exId);
    if (!superset || !target) return;

    const updatedEx: Exercise = {
      ...target,
      supersetId,
      sets: superset.rounds
    };

    const withoutTarget = routine.exercises.filter(e => e.id !== exId);
    let lastMemberIdx = -1;
    withoutTarget.forEach((e, i) => {
      if (e.supersetId === supersetId && e.isActive !== false) {
        lastMemberIdx = i;
      }
    });

    const newExercises = lastMemberIdx >= 0
      ? [
          ...withoutTarget.slice(0, lastMemberIdx + 1),
          updatedEx,
          ...withoutTarget.slice(lastMemberIdx + 1)
        ]
      : [...withoutTarget, updatedEx];

    onUpdate({ ...routine, exercises: newExercises });
  };

  const handleReorderBlocks = (newBlocks: RoutineBlock[]) => {
    const flattenedActive: Exercise[] = [];
    newBlocks.forEach(b => {
      if (b.type === 'single') {
        flattenedActive.push(b.exercise);
      } else {
        flattenedActive.push(...b.exercises);
      }
    });
    onUpdate({ ...routine, exercises: [...flattenedActive, ...inactiveExercises] });
  };

  const handleUpdateSuperset = (supersetId: string, updates: Partial<SupersetGroup>) => {
    const current = supersetsMap[supersetId];
    if (!current) return;
    const updatedSuperset = { ...current, ...updates };
    const newSupersets = { ...supersetsMap, [supersetId]: updatedSuperset };

    let newExercises = routine.exercises;
    if (updates.rounds !== undefined) {
      newExercises = routine.exercises.map(ex =>
        ex.supersetId === supersetId && ex.isActive !== false
          ? { ...ex, sets: updates.rounds! }
          : ex
      );
    }

    onUpdate({ ...routine, supersets: newSupersets, exercises: newExercises });
  };

  const handleUngroupSuperset = (supersetId: string) => {
    const newSupersets = { ...supersetsMap };
    delete newSupersets[supersetId];
    const newExercises = routine.exercises.map(ex => {
      if (ex.supersetId === supersetId) {
        const copy = { ...ex };
        delete copy.supersetId;
        return copy;
      }
      return ex;
    });
    onUpdate({ ...routine, supersets: newSupersets, exercises: newExercises });
  };

  const handleDeleteSuperset = (supersetId: string) => {
    const sup = supersetsMap[supersetId];
    const hasMembers = activeExercises.some(ex => ex.supersetId === supersetId);
    if (hasMembers && !window.confirm(`¿Eliminar "${sup?.name || 'Biserie'}" y quitar sus ejercicios de esta rutina? (Tu historial pasado se conserva intacto)`)) {
      return;
    }
    const newSupersets = { ...supersetsMap };
    delete newSupersets[supersetId];
    const newExercises = routine.exercises.map(ex => {
      if (ex.supersetId === supersetId) {
        const copy = { ...ex, isActive: false };
        delete copy.supersetId;
        return copy;
      }
      return ex;
    });
    onUpdate({ ...routine, supersets: newSupersets, exercises: newExercises });
  };

  const handleReorderMember = (supersetId: string, exId: string, direction: -1 | 1) => {
    const memberIndices: number[] = [];
    routine.exercises.forEach((ex, idx) => {
      if (ex.supersetId === supersetId && ex.isActive !== false) {
        memberIndices.push(idx);
      }
    });
    const posInGroup = memberIndices.findIndex(idx => routine.exercises[idx].id === exId);
    const targetPos = posInGroup + direction;
    if (posInGroup < 0 || targetPos < 0 || targetPos >= memberIndices.length) return;

    const newExercises = [...routine.exercises];
    const idxA = memberIndices[posInGroup];
    const idxB = memberIndices[targetPos];
    const temp = newExercises[idxA];
    newExercises[idxA] = newExercises[idxB];
    newExercises[idxB] = temp;

    onUpdate({ ...routine, exercises: newExercises });
  };

  const openCreateBiserieModal = () => {
    setNewBiserieName(`Biserie ${supersetsList.length + 1}`);
    setNewBiserieRounds(3);
    setNewBiserieNotes('');
    setIsAddBiserieModalOpen(true);
  };

  const handleCreateBiserie = () => {
    const trimmedName = newBiserieName.trim() || `Biserie ${supersetsList.length + 1}`;
    const newId = 'superset_' + Date.now();
    const newSuperset: SupersetGroup = {
      id: newId,
      name: trimmedName,
      rounds: Math.max(1, newBiserieRounds),
      notes: newBiserieNotes.trim()
    };

    onUpdate({
      ...routine,
      supersets: {
        ...supersetsMap,
        [newId]: newSuperset
      }
    });
    setIsAddBiserieModalOpen(false);
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
        <button onClick={onClose} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors min-h-[44px]">
          <ChevronLeft className="w-5 h-5" />
          <span className="font-semibold text-sm">Volver</span>
        </button>
        <div className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
          Editor de Plantilla
        </div>
        <button onClick={handleDelete} className="p-2.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      <div className="mb-6 relative">
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => { handleSaveTitle(); setIsEditingTitle(false); }}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') { handleSaveTitle(); setIsEditingTitle(false); } }}
            className="w-full bg-slate-900 text-2xl font-bold text-white border-b-2 border-emerald-400 pb-2 px-2 focus:outline-none rounded-t-lg transition-all"
          />
        ) : (
          <div
            onClick={() => setIsEditingTitle(true)}
            className="flex items-center justify-between group cursor-pointer border-b border-transparent hover:border-white/20 pb-2 transition-all"
          >
            <h2 className="text-2xl font-bold text-white pr-8">{title}</h2>
            <div className="p-2 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
              <PenLine className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </div>
          </div>
        )}
      </div>

      <div className="mb-6 text-sm text-gray-400">
        Arrastrá para reordenar ejercicios o biseries completas. También podés definir objetivos de peso o reps para la próxima sesión.
      </div>

      <Reorder.Group axis="y" values={blocks} onReorder={handleReorderBlocks} className="space-y-4">
        {blocks.map((block) =>
          block.type === 'single' ? (
            <SortableSingleItem
              key={`single_${block.exercise.id}`}
              block={block}
              supersetsList={supersetsList}
              onRemove={handleRemoveExercise}
              onUpdate={handleUpdateExercise}
              onMoveToSuperset={handleMoveToSuperset}
            />
          ) : (
            <SortableSupersetItem
              key={`superset_${block.superset.id}`}
              block={block}
              onUpdateSuperset={handleUpdateSuperset}
              onUngroupSuperset={handleUngroupSuperset}
              onDeleteSuperset={handleDeleteSuperset}
              onUpdateExercise={handleUpdateExercise}
              onRemoveExercise={handleRemoveExercise}
              onDetachExercise={handleDetachExercise}
              onReorderMember={handleReorderMember}
              onOpenAddExerciseToSuperset={(superset) => {
                setTargetSupersetForAdd(superset);
                setIsAddModalOpen(true);
              }}
            />
          )
        )}
      </Reorder.Group>

      {blocks.length === 0 && (
        <div className="text-center py-10 bg-slate-900/30 border border-dashed border-white/10 rounded-2xl mb-4">
          <p className="text-gray-500 font-medium">No hay ejercicios en esta rutina.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
        <button
          onClick={() => {
            setTargetSupersetForAdd(null);
            setIsAddModalOpen(true);
          }}
          className="w-full py-3.5 min-h-[48px] bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-400/20 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Añadir Ejercicio
        </button>

        <button
          onClick={openCreateBiserieModal}
          className="w-full py-3.5 min-h-[48px] bg-slate-900 text-white border border-emerald-400/40 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-400/10 transition-all cursor-pointer"
        >
          <Layers className="w-5 h-5 text-emerald-400" /> Añadir Biserie
        </button>
      </div>

      {isAddModalOpen && (
        <AddExerciseModal
          onClose={() => {
            setIsAddModalOpen(false);
            setTargetSupersetForAdd(null);
          }}
          onAdd={handleAddExercise}
          exerciseBank={exerciseBank}
          fixedSets={targetSupersetForAdd?.rounds}
          supersetId={targetSupersetForAdd?.id}
          supersetName={targetSupersetForAdd?.name}
          activeExerciseIds={activeExercises.map(e => e.id)}
        />
      )}

      {isAddBiserieModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-emerald-400 flex items-center gap-2">
                <Layers className="w-5 h-5" /> Nueva Biserie
              </h3>
              <button
                onClick={() => setIsAddBiserieModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Nombre o Número *</label>
                <input
                  type="text"
                  value={newBiserieName}
                  onChange={(e) => setNewBiserieName(e.target.value)}
                  placeholder="Ej. Biserie 1"
                  className="w-full min-h-[44px] bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Cantidad de Rondas *</label>
                <input
                  type="number"
                  min={1}
                  value={newBiserieRounds}
                  onChange={(e) => setNewBiserieRounds(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full min-h-[44px] bg-black/30 border border-white/10 rounded-lg p-2.5 text-white tabular-nums focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Notas de la Biserie (Opcional)</label>
                <textarea
                  value={newBiserieNotes}
                  onChange={(e) => setNewBiserieNotes(e.target.value)}
                  rows={3}
                  placeholder="Ej. 3 rondas en la misma torre. Pausa 60-90 s al terminar el par..."
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 resize-y"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsAddBiserieModalOpen(false)}
                className="px-4 py-2.5 min-h-[44px] rounded-lg border border-gray-600 text-gray-300 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateBiserie}
                className="px-5 py-2.5 min-h-[44px] rounded-lg bg-emerald-400 text-black font-semibold hover:brightness-110"
              >
                Crear Biserie
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
