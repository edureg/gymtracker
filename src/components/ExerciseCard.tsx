import React from 'react';
import { Trash2, Pen, Check, History, ArrowUp, ArrowDown, Plus, Minus } from 'lucide-react';
import { Exercise } from '../types';
import { getLastSessionData } from '../utils/storage';

interface Props {
  key?: React.Key;
  exercise: Exercise;
  dayLog: any;
  currentDate: Date;
  isEditMode: boolean;
  onUpdateLog: (setIdx: number, field: string, val: any) => void;
  onToggleSet: (setIdx: number) => void;
  onUpdateNote: (note: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDeactivate: () => void;
  onChangeSets: (delta: number) => void;
}

export default function ExerciseCard({
  exercise, dayLog, currentDate, isEditMode,
  onUpdateLog, onToggleSet, onUpdateNote,
  onMoveUp, onMoveDown, canMoveUp, canMoveDown, onDeactivate, onChangeSets
}: Props) {
  
  const lastSession = getLastSessionData(exercise.id, currentDate);
  const sessionNote = dayLog.note || '';

  const renderSets = () => {
    const sets = [];
    for (let i = 1; i <= exercise.sets; i++) {
      const setLog = dayLog[i] || {};
      const isDone = !!setLog.done;
      
      let historyText = null;
      if (lastSession && lastSession[i]) {
        const prev = lastSession[i];
        const parts = [];
        if (prev.weight) parts.push(`${prev.weight}kg`);
        if (prev.reps) parts.push(`${prev.reps} reps`);
        if (prev.time) parts.push(`${prev.time}s`);
        if (parts.length > 0) {
          historyText = parts.join(' - ');
        }
      }

      sets.push(
        <div key={i} className="mb-3">
          <div className={`grid gap-2 items-center ${exercise.hasTime ? 'grid-cols-[30px_1fr_1fr_1fr_40px]' : 'grid-cols-[30px_1fr_1fr_40px]'}`}>
            <span className="text-sm text-gray-400 font-semibold">#{i}</span>
            
            <div className="relative">
              <input 
                type="number" 
                placeholder="-"
                value={setLog.reps || ''}
                onChange={(e) => onUpdateLog(i, 'reps', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg py-2.5 px-2 text-center text-white focus:outline-none focus:border-emerald-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.65rem] text-gray-500 pointer-events-none">Reps</span>
            </div>

            <div className="relative">
              <input 
                type="number" 
                placeholder="-"
                value={setLog.weight || ''}
                onChange={(e) => onUpdateLog(i, 'weight', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg py-2.5 px-2 text-center text-white focus:outline-none focus:border-emerald-400"
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
                  className="w-full bg-black/30 border border-white/10 rounded-lg py-2.5 px-2 text-center text-white focus:outline-none focus:border-emerald-400"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.65rem] text-gray-500 pointer-events-none">Seg</span>
              </div>
            )}

            <button 
              onClick={() => onToggleSet(i)}
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                isDone 
                  ? 'bg-emerald-400 border-emerald-400 text-black shadow-[0_0_10px_rgba(52,211,153,0.4)]' 
                  : 'border-gray-600 text-transparent bg-transparent'
              }`}
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
          
          {historyText && (
            <div className="text-right text-xs text-gray-500 mt-1 mr-12 flex justify-end items-center gap-1" title={`Sesión anterior: ${lastSession.date}`}>
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
        <div className="flex justify-between items-start">
          <div className="text-lg font-semibold mb-1">{exercise.name}</div>
          {isEditMode && (
            <div className="flex items-center gap-1">
              <button 
                onClick={onMoveUp} 
                disabled={!canMoveUp}
                className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button 
                onClick={onMoveDown} 
                disabled={!canMoveDown}
                className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button 
                onClick={onDeactivate}
                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded ml-2"
                title="Desactivar Ejercicio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        {exercise.notes && <div className="text-sm text-gray-400 leading-relaxed">{exercise.notes}</div>}
        {lastSession && <div className="text-xs text-emerald-400 mt-1 italic opacity-80">Ult. vez: {lastSession.date}</div>}
        
        <div className="relative mt-3">
          <Pen className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
          <input 
            type="text" 
            placeholder="Añadir nota para hoy (ej. molestias)..."
            value={sessionNote}
            onChange={(e) => onUpdateNote(e.target.value)}
            className="w-full bg-black/40 border border-white/20 rounded-lg text-white text-xs py-2 pl-8 pr-3 focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {isEditMode && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <button onClick={() => onChangeSets(-1)} className="w-8 h-8 bg-black/30 border border-white/10 rounded-md flex items-center justify-center hover:bg-white/10">
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400">{exercise.sets} Series</span>
          <button onClick={() => onChangeSets(1)} className="w-8 h-8 bg-black/30 border border-white/10 rounded-md flex items-center justify-center hover:bg-white/10">
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
