import React, { useState, useEffect } from 'react';
import { Trash2, Pen, Check, History, ArrowUp, ArrowDown, Plus, Minus, Target, X } from 'lucide-react';
import { Exercise } from '../types';
import { getLastSessionData } from '../utils/storage';
import { formatDateDMY, formatTargetSummary } from '../utils/routineBlocks';

interface Props {
  key?: React.Key;
  exercise: Exercise;
  dayLog: any;
  currentDate: Date;
  isEditMode: boolean;
  onUpdateLog: (setIdx: number, field: string, val: any) => void;
  onToggleSet: (setIdx: number) => void;
  onUpdateNote: (note: string) => void;
  onUpdateTarget?: (targetWeight: string, targetReps: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDeactivate: () => void;
  onChangeSets: (delta: number) => void;
  onUpdateExerciseNotes: (notes: string) => void;
}

export default function ExerciseCard({
  exercise, dayLog, currentDate, isEditMode,
  onUpdateLog, onToggleSet, onUpdateNote, onUpdateTarget,
  onMoveUp, onMoveDown, canMoveUp, canMoveDown, onDeactivate, onChangeSets, onUpdateExerciseNotes
}: Props) {
  const lastSession = getLastSessionData(exercise.id, exercise.name, currentDate);
  const sessionNote = dayLog.note || '';

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [draftWeight, setDraftWeight] = useState(exercise.targetWeight || '');
  const [draftReps, setDraftReps] = useState(exercise.targetReps || '');

  useEffect(() => {
    setDraftWeight(exercise.targetWeight || '');
    setDraftReps(exercise.targetReps || '');
  }, [exercise.targetWeight, exercise.targetReps]);

  const targetSummary = formatTargetSummary(exercise);

  const handleSaveTarget = () => {
    if (onUpdateTarget) {
      onUpdateTarget(draftWeight.trim(), draftReps.trim());
    }
    setIsEditingTarget(false);
  };

  const handleClearTarget = () => {
    setDraftWeight('');
    setDraftReps('');
    if (onUpdateTarget) {
      onUpdateTarget('', '');
    }
    setIsEditingTarget(false);
  };

  const renderSets = () => {
    const sets = [];
    for (let i = 1; i <= exercise.sets; i++) {
      const setLog = dayLog[i] || {};
      const isDone = !!setLog.done;

      let historyText = null;
      if (lastSession && lastSession[i]) {
        const prev = lastSession[i];
        const parts = [];
        if (prev.weight) parts.push(`${prev.weight} kg`);
        if (prev.reps) parts.push(`${prev.reps} reps`);
        if (prev.time) parts.push(`${prev.time} s`);
        if (parts.length > 0) {
          historyText = parts.join(' · ');
        }
      }

      sets.push(
        <div key={i} className="mb-3">
          <div className={`grid gap-2 items-center ${exercise.hasTime ? 'grid-cols-[28px_1fr_1fr_1fr_44px]' : 'grid-cols-[28px_1fr_1fr_44px]'}`}>
            <span className="text-sm text-gray-400 font-semibold tabular-nums">#{i}</span>

            <div className="relative">
              <input
                type="number"
                placeholder="-"
                value={setLog.reps || ''}
                onChange={(e) => onUpdateLog(i, 'reps', e.target.value)}
                className="w-full min-h-[44px] bg-black/30 border border-white/10 rounded-lg py-2.5 px-2 pr-8 text-center text-white tabular-nums focus:outline-none focus:border-emerald-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.65rem] text-gray-500 pointer-events-none">Reps</span>
            </div>

            <div className="relative">
              <input
                type="number"
                placeholder="-"
                value={setLog.weight || ''}
                onChange={(e) => onUpdateLog(i, 'weight', e.target.value)}
                className="w-full min-h-[44px] bg-black/30 border border-white/10 rounded-lg py-2.5 px-2 pr-7 text-center text-white tabular-nums focus:outline-none focus:border-emerald-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.65rem] text-gray-500 pointer-events-none">Kg</span>
            </div>

            {exercise.hasTime && (
              <div className="relative">
                <input
                  type="number"
                  placeholder="-"
                  value={setLog.time || ''}
                  onChange={(e) => onUpdateLog(i, 'time', e.target.value)}
                  className="w-full min-h-[44px] bg-black/30 border border-white/10 rounded-lg py-2.5 px-2 pr-7 text-center text-white tabular-nums focus:outline-none focus:border-emerald-400"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.65rem] text-gray-500 pointer-events-none">Seg</span>
              </div>
            )}

            <button
              tabIndex={-1}
              onClick={() => onToggleSet(i)}
              aria-label={`Marcar serie ${i} completada`}
              className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${
                isDone
                  ? 'bg-emerald-400 border-emerald-400 text-black shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                  : 'border-gray-600 text-transparent bg-transparent hover:border-gray-400'
              }`}
            >
              <Check className="w-5 h-5" />
            </button>
          </div>

          {historyText && (
            <div className="text-right text-xs text-gray-500 mt-1 mr-13 flex justify-end items-center gap-1 tabular-nums" title={`Sesión anterior: ${formatDateDMY(lastSession.date)}`}>
              <History className="w-3 h-3" /> {historyText}
            </div>
          )}
        </div>
      );
    }
    return sets;
  };

  return (
    <div className="bg-slate-900/70 rounded-2xl p-5 border border-white/10 backdrop-blur-md transition-transform">
      <div className="mb-4">
        <div className="flex justify-between items-start gap-2">
          <div className="text-lg font-semibold mb-1 text-white">{exercise.name}</div>
          {isEditMode && (
            <div className="flex items-center gap-1">
              <button
                tabIndex={-1}
                onClick={onMoveUp}
                disabled={!canMoveUp}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                tabIndex={-1}
                onClick={onMoveDown}
                disabled={!canMoveDown}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                tabIndex={-1}
                onClick={onDeactivate}
                className="p-2 text-red-500 hover:bg-red-500/10 rounded ml-1"
                title="Desactivar Ejercicio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isEditMode ? (
          <input
            type="text"
            value={exercise.notes || ''}
            onChange={(e) => onUpdateExerciseNotes(e.target.value)}
            placeholder="Aclaraciones del ejercicio (ej. en banco scott)..."
            className="w-full bg-black/30 border border-white/10 rounded-lg py-1.5 px-2 text-sm text-gray-400 focus:outline-none focus:border-emerald-400 mb-1 mt-1"
          />
        ) : (
          exercise.notes && <div className="text-sm text-gray-400 leading-relaxed">{exercise.notes}</div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs">
          {lastSession && (
            <span className="text-emerald-400/80 italic tabular-nums">
              Últ. vez: {formatDateDMY(lastSession.date)}
            </span>
          )}

          {!isEditMode && onUpdateTarget && !isEditingTarget && (
            <>
              {lastSession && <span className="text-gray-600" aria-hidden="true">·</span>}
              <button
                type="button"
                onClick={() => setIsEditingTarget(true)}
                className={`inline-flex items-center gap-1.5 py-1 transition-colors cursor-pointer ${
                  targetSummary
                    ? 'text-amber-300 hover:text-amber-200 font-medium'
                    : 'text-gray-400 hover:text-emerald-400'
                }`}
              >
                <Target className="w-3.5 h-3.5 shrink-0" />
                <span className="tabular-nums">
                  {targetSummary ? `Objetivo próx. vez: ${targetSummary}` : 'Definir objetivo próx. vez'}
                </span>
              </button>
            </>
          )}
        </div>

        {!isEditMode && onUpdateTarget && isEditingTarget && (
          <div className="mt-3 p-3 bg-black/40 border border-amber-400/30 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Objetivo para la próxima vez
              </span>
              <button
                type="button"
                onClick={() => setIsEditingTarget(false)}
                className="text-gray-400 hover:text-white p-1"
                aria-label="Cerrar editor de objetivo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={draftWeight}
                onChange={(e) => setDraftWeight(e.target.value)}
                placeholder="Peso kg (ej. 25)"
                className="w-full min-h-[44px] bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-xs text-white tabular-nums focus:outline-none focus:border-amber-400"
              />
              <input
                type="text"
                value={draftReps}
                onChange={(e) => setDraftReps(e.target.value)}
                placeholder="Reps (ej. 10-12)"
                className="w-full min-h-[44px] bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-xs text-white tabular-nums focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              {(exercise.targetWeight || exercise.targetReps) && (
                <button
                  type="button"
                  onClick={handleClearTarget}
                  className="px-3 py-2 min-h-[40px] text-xs text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  Quitar
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveTarget}
                className="px-4 py-2 min-h-[40px] text-xs font-semibold bg-amber-400 text-black rounded-lg hover:brightness-110 transition"
              >
                Guardar objetivo
              </button>
            </div>
          </div>
        )}

        <div className="relative mt-3">
          <Pen className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Añadir nota para hoy (ej. molestias)..."
            value={sessionNote}
            onChange={(e) => onUpdateNote(e.target.value)}
            className="w-full min-h-[40px] bg-black/40 border border-white/20 rounded-lg text-white text-xs py-2 pl-8 pr-3 focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {isEditMode && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <button tabIndex={-1} onClick={() => onChangeSets(-1)} className="w-11 h-11 bg-black/30 border border-white/10 rounded-md flex items-center justify-center hover:bg-white/10">
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400 tabular-nums">{exercise.sets} Series</span>
          <button tabIndex={-1} onClick={() => onChangeSets(1)} className="w-11 h-11 bg-black/30 border border-white/10 rounded-md flex items-center justify-center hover:bg-white/10">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col">
        {renderSets()}
      </div>
    </div>
  );
}
