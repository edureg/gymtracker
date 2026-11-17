import React, { useState, useEffect } from 'react';
import { Check, History, Pen, Target, X } from 'lucide-react';
import { Exercise, SupersetGroup, DayLog } from '../types';
import { getLastSessionData } from '../utils/storage';
import { formatDateDMY, formatTargetSummary } from '../utils/routineBlocks';

interface Props {
  key?: React.Key;
  superset: SupersetGroup;
  exercises: Exercise[];
  dayLog: DayLog;
  currentDate: Date;
  onUpdateLog: (exId: string, setIdx: number, field: string, val: any) => void;
  onToggleSet: (exId: string, setIdx: number) => void;
  onUpdateNote: (exId: string, note: string) => void;
  onUpdateTarget: (exId: string, targetWeight: string, targetReps: string) => void;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function BiserieCard({
  superset,
  exercises,
  dayLog,
  currentDate,
  onUpdateLog,
  onToggleSet,
  onUpdateNote,
  onUpdateTarget
}: Props) {
  const rounds = Math.max(1, superset.rounds || exercises[0]?.sets || 3);

  const [editingTargetExId, setEditingTargetExId] = useState<string | null>(null);
  const [draftWeight, setDraftWeight] = useState('');
  const [draftReps, setDraftReps] = useState('');

  useEffect(() => {
    if (editingTargetExId) {
      const targetEx = exercises.find(e => e.id === editingTargetExId);
      setDraftWeight(targetEx?.targetWeight || '');
      setDraftReps(targetEx?.targetReps || '');
    }
  }, [editingTargetExId, exercises]);

  const lastSessionsMap = new Map<string, any>();
  exercises.forEach(ex => {
    lastSessionsMap.set(ex.id, getLastSessionData(ex.id, ex.name, currentDate));
  });

  const openTargetEditor = (ex: Exercise) => {
    setEditingTargetExId(ex.id);
    setDraftWeight(ex.targetWeight || '');
    setDraftReps(ex.targetReps || '');
  };

  const handleSaveTarget = (exId: string) => {
    onUpdateTarget(exId, draftWeight.trim(), draftReps.trim());
    setEditingTargetExId(null);
  };

  const handleClearTarget = (exId: string) => {
    onUpdateTarget(exId, '', '');
    setEditingTargetExId(null);
  };

  return (
    <div className="bg-slate-900/70 rounded-2xl p-4 sm:p-5 border border-emerald-400/25 backdrop-blur-md">
      {/* Cabecera de Biserie */}
      <div className="pb-4 border-b border-white/10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold text-emerald-400">{superset.name || 'Biserie'}</h3>
          <div className="text-xs text-gray-400 tabular-nums">
            {rounds} {rounds === 1 ? 'ronda' : 'rondas'} · {exercises.length} ejercicios
          </div>
        </div>
        {superset.notes && (
          <p className="text-sm text-gray-300 leading-relaxed mt-1.5">{superset.notes}</p>
        )}
      </div>

      {/* Ficha de ejercicios integrantes: notas técnicas, última vez, objetivo editable y nota del día */}
      <div className="py-4 space-y-4 border-b border-white/10">
        {exercises.map((ex, idx) => {
          const letter = LETTERS[idx] || `${idx + 1}`;
          const lastSession = lastSessionsMap.get(ex.id);
          const exDayLog = dayLog[ex.id] || {};
          const sessionNote = exDayLog.note || '';
          const targetSummary = formatTargetSummary(ex);
          const isEditingThisTarget = editingTargetExId === ex.id;

          return (
            <div key={ex.id} className={idx > 0 ? 'pt-3 border-t border-white/5' : ''}>
              <div className="text-sm font-semibold text-white">
                <span className="text-emerald-400 mr-1.5">{letter} ·</span>
                {ex.name}
              </div>

              {ex.notes && (
                <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{ex.notes}</div>
              )}

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs">
                {lastSession && (
                  <span className="text-emerald-400/80 italic tabular-nums">
                    Últ. vez: {formatDateDMY(lastSession.date)}
                  </span>
                )}
                {lastSession && <span className="text-gray-600" aria-hidden="true">·</span>}

                {!isEditingThisTarget && (
                  <button
                    type="button"
                    onClick={() => openTargetEditor(ex)}
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
                )}
              </div>

              {isEditingThisTarget && (
                <div className="mt-2.5 p-3 bg-black/40 border border-amber-400/30 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" /> Objetivo próx. vez ({letter})
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingTargetExId(null)}
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
                      placeholder="Peso kg (ej. 20)"
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
                    {(ex.targetWeight || ex.targetReps) && (
                      <button
                        type="button"
                        onClick={() => handleClearTarget(ex.id)}
                        className="px-3 py-2 min-h-[40px] text-xs text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        Quitar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSaveTarget(ex.id)}
                      className="px-4 py-2 min-h-[40px] text-xs font-semibold bg-amber-400 text-black rounded-lg hover:brightness-110 transition"
                    >
                      Guardar objetivo
                    </button>
                  </div>
                </div>
              )}

              <div className="relative mt-2">
                <Pen className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder={`Nota de hoy para ${ex.name}...`}
                  value={sessionNote}
                  onChange={(e) => onUpdateNote(ex.id, e.target.value)}
                  className="w-full min-h-[40px] bg-black/40 border border-white/15 rounded-lg text-white text-xs py-2 pl-8 pr-3 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Rondas agrupadas */}
      <div className="pt-4 space-y-5">
        {Array.from({ length: rounds }, (_, rIdx) => {
          const roundNumber = rIdx + 1;
          const allRoundDone = exercises.length > 0 && exercises.every(ex => !!dayLog[ex.id]?.[roundNumber]?.done);

          return (
            <div key={roundNumber} className={rIdx > 0 ? 'pt-4 border-t border-white/10' : ''}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-bold tracking-wide tabular-nums ${allRoundDone ? 'text-emerald-400' : 'text-gray-200'}`}>
                  Ronda {roundNumber} de {rounds}
                </span>
                {allRoundDone && (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Completa
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {exercises.map((ex, exIdx) => {
                  const letter = LETTERS[exIdx] || `${exIdx + 1}`;
                  const exLog = dayLog[ex.id] || {};
                  const setLog = exLog[roundNumber] || {};
                  const isDone = !!setLog.done;
                  const lastSession = lastSessionsMap.get(ex.id);

                  let historyText = null;
                  if (lastSession && lastSession[roundNumber]) {
                    const prev = lastSession[roundNumber];
                    const parts = [];
                    if (prev.weight) parts.push(`${prev.weight} kg`);
                    if (prev.reps) parts.push(`${prev.reps} reps`);
                    if (prev.time) parts.push(`${prev.time} s`);
                    if (parts.length > 0) {
                      historyText = parts.join(' · ');
                    }
                  }

                  return (
                    <div key={`${ex.id}_r${roundNumber}`}>
                      <div className="text-xs text-gray-300 font-medium mb-1.5 truncate">
                        <span className="text-emerald-400 font-semibold mr-1">{letter}</span>
                        {ex.name}
                      </div>

                      <div className={`grid gap-2 items-center ${ex.hasTime ? 'grid-cols-[1fr_1fr_1fr_44px]' : 'grid-cols-[1fr_1fr_44px]'}`}>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="-"
                            value={setLog.reps || ''}
                            onChange={(e) => onUpdateLog(ex.id, roundNumber, 'reps', e.target.value)}
                            className="w-full min-h-[44px] bg-black/30 border border-white/10 rounded-lg py-2.5 px-2 pr-8 text-center text-white tabular-nums focus:outline-none focus:border-emerald-400"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.65rem] text-gray-500 pointer-events-none">Reps</span>
                        </div>

                        <div className="relative">
                          <input
                            type="number"
                            placeholder="-"
                            value={setLog.weight || ''}
                            onChange={(e) => onUpdateLog(ex.id, roundNumber, 'weight', e.target.value)}
                            className="w-full min-h-[44px] bg-black/30 border border-white/10 rounded-lg py-2.5 px-2 pr-7 text-center text-white tabular-nums focus:outline-none focus:border-emerald-400"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.65rem] text-gray-500 pointer-events-none">Kg</span>
                        </div>

                        {ex.hasTime && (
                          <div className="relative">
                            <input
                              type="number"
                              placeholder="-"
                              value={setLog.time || ''}
                              onChange={(e) => onUpdateLog(ex.id, roundNumber, 'time', e.target.value)}
                              className="w-full min-h-[44px] bg-black/30 border border-white/10 rounded-lg py-2.5 px-2 pr-7 text-center text-white tabular-nums focus:outline-none focus:border-emerald-400"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.65rem] text-gray-500 pointer-events-none">Seg</span>
                          </div>
                        )}

                        <button
                          tabIndex={-1}
                          onClick={() => onToggleSet(ex.id, roundNumber)}
                          aria-label={`Marcar ${ex.name} ronda ${roundNumber} completada`}
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
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
