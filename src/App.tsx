import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, PenLine, Plus, Unlock, Lock, Download, Upload, Timer as TimerIcon, History, X, Home, Calendar, CheckCircle } from 'lucide-react';
import { RoutineConfig, DayLog, Exercise } from './types';
import { loadRoutineConfig, saveRoutineConfig, getDayLog, saveDayLog, getLastDayMetrics } from './utils/storage';
import { exportCSV, exportJSON, importFile } from './utils/exportImport';
import ExerciseCard from './components/ExerciseCard';
import TimerPanel from './components/TimerPanel';
import AddExerciseModal from './components/AddExerciseModal';
import RoutineHistoryModal from './components/RoutineHistoryModal';

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [routineConfig, setRoutineConfig] = useState<RoutineConfig>({});
  const [dayLog, setDayLog] = useState<DayLog>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [routineForHistory, setRoutineForHistory] = useState<Routine | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'workout'>('home');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const activeRoutineId = dayLog.routineId;
  const currentDayRoutine = activeRoutineId ? routineConfig[activeRoutineId] : null;

  const lastDayMetrics = getLastDayMetrics(currentDate, currentDayRoutine);

  useEffect(() => {
    setRoutineConfig(loadRoutineConfig());
  }, [refreshTrigger]);

  useEffect(() => {
    setDayLog(getDayLog(currentDate));
  }, [currentDate, refreshTrigger]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.target instanceof HTMLElement) {
        if (e.target.tagName.toLowerCase() === 'textarea') {
          return; // Allow newlines in textareas
        }
        
        const focusableElements = Array.from(document.querySelectorAll('input, textarea, select'))
          .filter(el => !(el as HTMLInputElement).disabled && (el as HTMLElement).tabIndex !== -1);
        
        const index = focusableElements.indexOf(e.target as HTMLElement);
        if (index > -1 && index < focusableElements.length - 1) {
          e.preventDefault();
          (focusableElements[index + 1] as HTMLElement).focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const handleDayNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newLog = { ...dayLog, _day_note_: e.target.value };
    setDayLog(newLog);
    saveDayLog(currentDate, newLog);
  };

  const handleDayMetricChange = (field: string, value: string) => {
    const newLog = { ...dayLog, [field]: value };
    setDayLog(newLog);
    saveDayLog(currentDate, newLog);
  };

  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  const executeExport = (type: 'csv' | 'json' | 'both') => {
    if (type === 'csv' || type === 'both') {
      exportCSV(routineConfig);
    }
    if (type === 'json' || type === 'both') {
      exportJSON(routineConfig);
    }
    setIsExportModalOpen(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importFile(file, routineConfig, (newConfig) => {
        if (newConfig) {
          setRoutineConfig(newConfig);
        }
        setRefreshTrigger(prev => prev + 1);
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
    }
  };

  const dayIndex = currentDate.getDay(); // Mantenido solo si se necesita, pero ya no rige la app
  
  const activeExercises = currentDayRoutine?.exercises?.filter(ex => ex.isActive !== false) || [];
  const inactiveExercises = currentDayRoutine?.exercises?.filter(ex => ex.isActive === false) || [];

  const updateRoutineTitle = (title: string) => {
    if (!activeRoutineId || !currentDayRoutine) return;
    const newConfig = {
      ...routineConfig,
      [activeRoutineId]: { ...currentDayRoutine, title }
    };
    setRoutineConfig(newConfig);
    saveRoutineConfig(newConfig);
  };

  const createNewRoutine = () => {
    const rId = 'routine_' + Date.now();
    const newRoutine = {
      id: rId,
      title: 'Nueva Rutina',
      exercises: []
    };
    const newConfig = { ...routineConfig, [rId]: newRoutine };
    setRoutineConfig(newConfig);
    saveRoutineConfig(newConfig);
    handleDayMetricChange('routineId', rId);
    setIsEditMode(true);
  };

  const unlinkRoutineFromDay = () => {
    const newLog = { ...dayLog };
    delete newLog.routineId;
    setDayLog(newLog);
    saveDayLog(currentDate, newLog);
  };

  const deleteCurrentRoutine = () => {
    if (!activeRoutineId || !currentDayRoutine) return;
    if (!window.confirm(`¿Seguro que querés borrar permanentemente la rutina "${currentDayRoutine.title}"? Perderás su configuración global (no el historial pasado).`)) return;
    const newConfig = { ...routineConfig };
    delete newConfig[activeRoutineId];
    setRoutineConfig(newConfig);
    saveRoutineConfig(newConfig);
    unlinkRoutineFromDay();
    setIsEditMode(false);
  };

  const selectRoutineForDay = (id: string) => {
    handleDayMetricChange('routineId', id);
  };

  const startRoutineToday = (routineId: string) => {
      const today = new Date();
      const tLog = getDayLog(today);
      
      let tLogHasData = false;
      if (tLog) {
         for (const key of Object.keys(tLog)) {
            if (!['routineId', '_day_note_', 'calories', 'duration', 'avgHeartRate', 'maxHeartRate'].includes(key)) {
               const exData = tLog[key];
               for (const setKey of Object.keys(exData)) {
                  if (setKey !== 'note' && (exData[setKey].reps || exData[setKey].weight || exData[setKey].time)) {
                     tLogHasData = true;
                     break;
                  }
               }
            }
         }
      }

      if (tLog.routineId && tLog.routineId !== routineId && tLogHasData) {
          if (!window.confirm("Ya tienes datos en otra rutina de hoy. Si la cambiás, los descartarás en esta vista. ¿Continuar y cambiar?")) {
              return;
          }
      }
      
      const newLog = { ...tLog, routineId };
      saveDayLog(today, newLog);
      setCurrentDate(today);
      setRefreshTrigger(prev => prev + 1);
      setCurrentView('workout');
  };

  const createNewRoutineFromHome = () => {
    const rId = 'routine_' + Date.now();
    const newRoutine = {
      id: rId,
      title: 'Nueva Rutina',
      exercises: []
    };
    const newConfig = { ...routineConfig, [rId]: newRoutine };
    setRoutineConfig(newConfig);
    saveRoutineConfig(newConfig);
    
    const today = new Date();
    const tLog = getDayLog(today);
    const newLog = { ...tLog, routineId: rId };
    saveDayLog(today, newLog);
    setCurrentDate(today);
    setRefreshTrigger(prev => prev + 1);
    setCurrentView('workout');
    setIsEditMode(true);
  };

  let currentLogHasData = false;
  if (dayLog) {
     for (const key of Object.keys(dayLog)) {
        if (!['routineId', '_day_note_', 'calories', 'duration', 'avgHeartRate', 'maxHeartRate'].includes(key)) {
           const exData = dayLog[key];
           for (const setKey of Object.keys(exData)) {
              if (setKey !== 'note' && (exData[setKey].reps || exData[setKey].weight || exData[setKey].time)) {
                 currentLogHasData = true;
                 break;
              }
           }
        }
     }
  }

  const todayDateObj = new Date();
  const todayLogState = getDayLog(todayDateObj);
  const todayRoutineId = todayLogState.routineId;
  const todayRoutineObj = todayRoutineId ? routineConfig[todayRoutineId] : null;
  const todayHasFinishedMetrics = !!(todayLogState.calories || todayLogState.duration || todayLogState.avgHeartRate || todayLogState.maxHeartRate);

  const moveExercise = (exIndex: number, direction: number) => {
    if (!activeRoutineId || !currentDayRoutine) return;
    const newExercises = [...currentDayRoutine.exercises];
    // Find the actual index in the full array
    const activeEx = activeExercises[exIndex];
    const actualIndex = newExercises.findIndex(e => e.id === activeEx.id);
    
    // Find the target active exercise to swap with
    const targetActiveEx = activeExercises[exIndex + direction];
    if (!targetActiveEx) return;
    const targetActualIndex = newExercises.findIndex(e => e.id === targetActiveEx.id);

    // Swap
    const temp = newExercises[actualIndex];
    newExercises[actualIndex] = newExercises[targetActualIndex];
    newExercises[targetActualIndex] = temp;

    const newConfig = {
      ...routineConfig,
      [activeRoutineId]: { ...currentDayRoutine, exercises: newExercises }
    };
    setRoutineConfig(newConfig);
    saveRoutineConfig(newConfig);
  };

  const toggleExerciseActive = (exId: string, isActive: boolean) => {
    if (!activeRoutineId || !currentDayRoutine) return;
    const newExercises = currentDayRoutine.exercises.map(ex => 
      ex.id === exId ? { ...ex, isActive } : ex
    );
    const newConfig = {
      ...routineConfig,
      [activeRoutineId]: { ...currentDayRoutine, exercises: newExercises }
    };
    setRoutineConfig(newConfig);
    saveRoutineConfig(newConfig);
  };

  const updateExerciseNotes = (exId: string, newNotes: string) => {
    if (!activeRoutineId || !currentDayRoutine) return;
    const newExercises = currentDayRoutine.exercises.map(ex => 
      ex.id === exId ? { ...ex, notes: newNotes } : ex
    );
    const newConfig = {
      ...routineConfig,
      [activeRoutineId]: { ...currentDayRoutine, exercises: newExercises }
    };
    setRoutineConfig(newConfig);
    saveRoutineConfig(newConfig);
  };

  const changeSets = (exId: string, delta: number) => {
    if (!activeRoutineId || !currentDayRoutine) return;
    const newExercises = currentDayRoutine.exercises.map(ex => {
      if (ex.id === exId) {
        const newSets = Math.max(1, ex.sets + delta);
        return { ...ex, sets: newSets };
      }
      return ex;
    });
    const newConfig = {
      ...routineConfig,
      [activeRoutineId]: { ...currentDayRoutine, exercises: newExercises }
    };
    setRoutineConfig(newConfig);
    saveRoutineConfig(newConfig);
  };

  const addExercise = (exercise: Exercise) => {
    if (!activeRoutineId || !currentDayRoutine) return;
    const newExercises = [...(currentDayRoutine.exercises || [])];
    const existingIdx = newExercises.findIndex(e => e.id === exercise.id);
    
    if (existingIdx >= 0) {
      newExercises[existingIdx] = { ...exercise, isActive: true };
    } else {
      newExercises.push(exercise);
    }

    const newConfig = {
      ...routineConfig,
      [activeRoutineId]: { ...currentDayRoutine, exercises: newExercises }
    };
    setRoutineConfig(newConfig);
    saveRoutineConfig(newConfig);
  };

  const updateExerciseLog = (exId: string, setIdx: number, field: string, value: any) => {
    const exLog = dayLog[exId] || {};
    const setLog = exLog[setIdx] || {};
    
    const newSetLog = { ...setLog, [field]: value };
    if (newSetLog.reps || newSetLog.weight || newSetLog.time) {
      newSetLog.done = true;
    }

    const newExLog = { ...exLog, [setIdx]: newSetLog };
    const newDayLog = { ...dayLog, [exId]: newExLog };
    
    setDayLog(newDayLog);
    saveDayLog(currentDate, newDayLog);
  };

  const toggleSetDone = (exId: string, setIdx: number) => {
    const exLog = dayLog[exId] || {};
    const setLog = exLog[setIdx] || {};
    
    const newSetLog = { ...setLog, done: !setLog.done };
    const newExLog = { ...exLog, [setIdx]: newSetLog };
    const newDayLog = { ...dayLog, [exId]: newExLog };
    
    setDayLog(newDayLog);
    saveDayLog(currentDate, newDayLog);
  };

  const updateSessionNote = (exId: string, note: string) => {
    const exLog = dayLog[exId] || {};
    const newExLog = { ...exLog, note };
    const newDayLog = { ...dayLog, [exId]: newExLog };
    
    setDayLog(newDayLog);
    saveDayLog(currentDate, newDayLog);
  };

  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  let dateStr = currentDate.toLocaleDateString('es-AR', dateOptions);
  dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const isToday = new Date().toDateString() === currentDate.toDateString();

  // Compute Exercise Bank (all unique exercises across all days)
  const allExercisesMap = new Map<string, Exercise>();
  Object.values(routineConfig).forEach(day => {
    day.exercises?.forEach(ex => {
      if (!allExercisesMap.has(ex.id)) {
        allExercisesMap.set(ex.id, ex);
      }
    });
  });
  
  // Filter out exercises that are already active TODAY
  const activeIdsToday = new Set(activeExercises.map(e => e.id));
  const exerciseBank = Array.from(allExercisesMap.values()).filter(ex => !activeIdsToday.has(ex.id));

  return (
    <div className="max-w-[600px] mx-auto pb-24 px-4 pt-5">
      {currentView === 'home' ? (
        <>
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Gym Tracker <span className="text-[0.6em] text-gray-400">v9.14</span>
            </h1>
            <div className="text-[0.7em] text-emerald-400">React v9.14 OK</div>
          </header>

          {todayRoutineObj ? (
             todayHasFinishedMetrics ? (
                <div className="bg-slate-900/60 border border-emerald-500/50 p-5 rounded-2xl mb-8 flex flex-col items-center text-center">
                   <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                   </div>
                   <h2 className="text-emerald-400 text-lg font-bold mb-1">¡Entrenamiento Finalizado!</h2>
                   <p className="text-gray-300 mb-5">{todayRoutineObj.title}</p>
                   <button 
                      onClick={() => {
                         setCurrentDate(new Date());
                         setCurrentView('workout');
                      }}
                      className="w-full py-3 bg-black/40 text-emerald-400 border border-emerald-400/20 font-bold rounded-xl hover:bg-emerald-400/10 transition-colors"
                   >
                      Ver / Editar
                   </button>
                </div>
             ) : (
                <div className="bg-emerald-400/10 border border-emerald-400/30 p-5 rounded-2xl mb-8">
                   <h2 className="text-emerald-400 font-bold mb-2">Entrenamiento de hoy en curso</h2>
                   <p className="text-gray-200 text-lg mb-4">{todayRoutineObj.title}</p>
                   <button 
                      onClick={() => {
                         setCurrentDate(new Date());
                         setCurrentView('workout');
                      }}
                      className="w-full py-3 bg-emerald-400 text-black font-bold rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:bg-emerald-300 transition-colors"
                   >
                      Continuar Entrenamiento
                   </button>
                </div>
             )
          ) : (
             <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-2">¡Hola! ¿Qué entrenamos hoy?</h2>
                <p className="text-gray-400 text-sm">Seleccioná una rutina de tu lista para comenzar a registrar tu actividad de hoy.</p>
             </div>
          )}

          <div className="space-y-4">
             <h3 className="text-lg font-bold text-gray-300 border-b border-white/10 pb-2">Tus Rutinas</h3>
             {Object.values(routineConfig).map(routine => (
                <div key={routine.id} className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 hover:bg-white/5 transition-colors">
                   <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-emerald-400">{routine.title}</span>
                      <span className="text-sm text-gray-400">{routine.exercises?.filter(e => e.isActive !== false).length || 0} ejercicios</span>
                   </div>
                   <div className="grid grid-cols-2 gap-2 mt-2">
                      <button 
                         onClick={() => startRoutineToday(routine.id)}
                         className="py-2.5 bg-black/40 text-emerald-400 border border-emerald-400/20 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400/10 transition-colors"
                      >
                         <Plus className="w-4 h-4" /> Entrenar Hoy
                      </button>
                      <button 
                         onClick={() => setRoutineForHistory(routine)}
                         className="py-2.5 bg-black/40 text-gray-300 border border-white/10 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                      >
                         <History className="w-4 h-4" /> Historial
                      </button>
                   </div>
                </div>
             ))}
             
             <button 
               onClick={createNewRoutineFromHome}
               className="w-full py-4 mt-2 bg-transparent text-emerald-400 border-2 border-dashed border-emerald-400/30 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400/10 transition-colors"
             >
               <Plus className="w-5 h-5" /> Crear Nueva Rutina
             </button>
          </div>

          <div className="mt-10 text-center pt-6">
             <button
                onClick={() => {
                   setCurrentDate(new Date());
                   setCurrentView('workout');
                }}
                className="text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
             >
                <Calendar className="w-4 h-4"/> Ver mi Histórico (Navegar días)
             </button>
          </div>
        </>
      ) : (
        <>
          <header className="flex justify-between items-center mb-6">
            <button 
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors"
            >
              <Home className="w-5 h-5" /> <span className="text-sm font-semibold">Menú</span>
            </button>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Gym Tracker
            </h1>
          </header>

          <div className="flex items-center gap-3 mb-6 bg-slate-900/70 p-3 rounded-2xl backdrop-blur-md border border-white/10">
        <button tabIndex={-1} onClick={() => changeDate(-1)} className="p-2 text-emerald-400 hover:bg-white/5 rounded-lg"><ChevronLeft /></button>
        <div className="flex-grow flex flex-col items-center justify-center">
             <div className="text-center font-semibold text-base sm:text-lg">{dateStr}</div>
             {!isToday && (
                <button 
                  onClick={() => setCurrentDate(new Date())}
                  className="text-xs text-emerald-400 mb-[-5px] mt-1 flex items-center gap-1 hover:text-emerald-300"
                >
                  <Home className="w-3 h-3" /> Ir a hoy
                </button>
             )}
        </div>
        <button tabIndex={-1} onClick={() => changeDate(1)} className="p-2 text-emerald-400 hover:bg-white/5 rounded-lg"><ChevronRight /></button>
      </div>

      {!activeRoutineId ? (
            <div className="text-center py-10">
              <h2 className="text-xl font-bold mb-6 text-emerald-400">¿Qué rutina vas a hacer este día?</h2>
              <div className="space-y-4 px-4">
                {Object.values(routineConfig).map(routine => (
                  <div key={routine.id} className="flex gap-2">
                    <button 
                      onClick={() => selectRoutineForDay(routine.id)}
                      className="flex-grow py-4 px-5 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/5 hover:border-emerald-400/50 transition-colors"
                     >
                      <div className="text-lg font-semibold text-gray-200">{routine.title}</div>
                      <div className="text-sm text-gray-500">{routine.exercises?.filter(e => e.isActive !== false).length || 0} ejercicios</div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
      ) : (
        <>
          <div className="flex flex-col mb-6">
            <div className="flex justify-between items-start mb-2">
              {isEditMode ? (
                <input 
                  type="text"
                  value={currentDayRoutine?.title || ''}
                  onChange={(e) => updateRoutineTitle(e.target.value)}
                  placeholder="Nombre de la rutina"
                  className="bg-transparent border-b border-emerald-400 text-lg font-bold text-white focus:outline-none w-[60%] pb-1"
                />
              ) : (
                <div className="text-xl font-bold text-emerald-400 flex flex-wrap items-center gap-2">
                  <span>{currentDayRoutine?.title}</span>
                  <div className="flex gap-1 ml-auto">
                    <button 
                      onClick={() => setRoutineForHistory(currentDayRoutine)}
                      className="p-2 bg-emerald-400/10 text-emerald-400 rounded-lg hover:bg-emerald-400/20 transition-colors"
                      title="Ver Historial de Rutina"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    {!currentLogHasData && (
                        <button 
                          onClick={unlinkRoutineFromDay}
                          className="text-xs font-semibold text-orange-400 bg-orange-400/10 px-3 py-2 rounded-lg hover:bg-orange-400/20 whitespace-nowrap transition-colors"
                        >
                          Cambiar
                        </button>
                    )}
                  </div>
                </div>
              )}

              {isEditMode && (
                 <div className="flex flex-col gap-2 items-end">
                    <button 
                      onClick={unlinkRoutineFromDay}
                      className="text-xs text-orange-400 bg-orange-400/10 px-3 py-1.5 rounded-lg hover:bg-orange-400/20 whitespace-nowrap"
                    >
                      Desvincular de Hoy
                    </button>
                    <button 
                      onClick={deleteCurrentRoutine}
                      className="text-xs text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 whitespace-nowrap"
                    >
                      Borrar Rutina (Global)
                    </button>
                 </div>
              )}
            </div>
          </div>

          <div className="mb-5 relative">
            <PenLine className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <textarea
              value={dayLog._day_note_ || ''}
              onChange={handleDayNoteChange}
          placeholder="Observaciones generales para el día de entrenamiento..."
          rows={2}
          className="w-full bg-black/40 border border-white/20 rounded-lg text-white text-sm py-2.5 pr-3 pl-9 resize-y focus:outline-none focus:border-emerald-400"
        />
      </div>

      <div className="space-y-5">
        {activeExercises.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-5xl mb-4 opacity-50">🏋️</div>
            <p className="text-lg">No hay ejercicios programados para hoy.</p>
          </div>
        ) : (
          activeExercises.map((ex, idx) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              dayLog={dayLog[ex.id] || {}}
              currentDate={currentDate}
              isEditMode={isEditMode}
              onUpdateLog={(setIdx, field, val) => updateExerciseLog(ex.id, setIdx, field, val)}
              onToggleSet={(setIdx) => toggleSetDone(ex.id, setIdx)}
              onUpdateNote={(note) => updateSessionNote(ex.id, note)}
              onMoveUp={() => moveExercise(idx, -1)}
              onMoveDown={() => moveExercise(idx, 1)}
              canMoveUp={idx > 0}
              canMoveDown={idx < activeExercises.length - 1}
              onDeactivate={() => toggleExerciseActive(ex.id, false)}
              onChangeSets={(delta) => changeSets(ex.id, delta)}
              onUpdateExerciseNotes={(notes) => updateExerciseNotes(ex.id, notes)}
            />
          ))
        )}

        {isEditMode && inactiveExercises.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-gray-400 mb-4 font-medium">Ejercicios Desactivados</h3>
            <div className="space-y-3">
              {inactiveExercises.map(ex => (
                <div key={ex.id} className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/5">
                  <span className="text-gray-300">{ex.name}</span>
                  <button 
                    tabIndex={-1}
                    onClick={() => toggleExerciseActive(ex.id, true)}
                    className="text-emerald-400 text-sm px-3 py-1 bg-emerald-400/10 rounded-md hover:bg-emerald-400/20"
                  >
                    Restaurar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-slate-900/70 rounded-2xl p-5 border border-white/10 backdrop-blur-md">
        <h3 className="text-lg font-semibold mb-4 text-emerald-400">Resumen del Entrenamiento</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Calorías (kcal)</label>
            <input 
              type="number" 
              value={dayLog.calories || ''}
              onChange={(e) => handleDayMetricChange('calories', e.target.value)}
              placeholder="Ej: 953"
              className="w-full bg-black/40 border border-white/20 rounded-lg text-white text-sm py-2 px-3 focus:outline-none focus:border-emerald-400"
            />
            {lastDayMetrics?.calories && (
              <div className="text-right text-xs text-gray-500 mt-1 flex justify-end items-center gap-1" title={`Anterior: ${lastDayMetrics.date}`}>
                <History className="w-3 h-3" /> {lastDayMetrics.calories}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Duración (HH:MM:SS)</label>
            <input 
              type="text" 
              value={dayLog.duration || ''}
              onChange={(e) => handleDayMetricChange('duration', e.target.value)}
              placeholder="Ej: 01:20:20"
              className="w-full bg-black/40 border border-white/20 rounded-lg text-white text-sm py-2 px-3 focus:outline-none focus:border-emerald-400"
            />
            {lastDayMetrics?.duration && (
              <div className="text-right text-xs text-gray-500 mt-1 flex justify-end items-center gap-1" title={`Anterior: ${lastDayMetrics.date}`}>
                <History className="w-3 h-3" /> {lastDayMetrics.duration}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">FC Promedio (ppm)</label>
            <input 
              type="number" 
              value={dayLog.avgHeartRate || ''}
              onChange={(e) => handleDayMetricChange('avgHeartRate', e.target.value)}
              placeholder="Ej: 117"
              className="w-full bg-black/40 border border-white/20 rounded-lg text-white text-sm py-2 px-3 focus:outline-none focus:border-emerald-400"
            />
            {lastDayMetrics?.avgHeartRate && (
              <div className="text-right text-xs text-gray-500 mt-1 flex justify-end items-center gap-1" title={`Anterior: ${lastDayMetrics.date}`}>
                <History className="w-3 h-3" /> {lastDayMetrics.avgHeartRate}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">FC Máxima (ppm)</label>
            <input 
              type="number" 
              value={dayLog.maxHeartRate || ''}
              onChange={(e) => handleDayMetricChange('maxHeartRate', e.target.value)}
              placeholder="Ej: 152"
              className="w-full bg-black/40 border border-white/20 rounded-lg text-white text-sm py-2 px-3 focus:outline-none focus:border-emerald-400"
            />
            {lastDayMetrics?.maxHeartRate && (
              <div className="text-right text-xs text-gray-500 mt-1 flex justify-end items-center gap-1" title={`Anterior: ${lastDayMetrics.date}`}>
                <History className="w-3 h-3" /> {lastDayMetrics.maxHeartRate}
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditMode && (
        <button 
          tabIndex={-1}
          onClick={() => setIsAddModalOpen(true)}
          className="w-full mt-5 bg-emerald-400 text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(52,211,153,0.4)]"
        >
          <Plus className="w-5 h-5" /> Añadir Ejercicio
        </button>
      )}

      <button 
        tabIndex={-1}
        onClick={() => setIsEditMode(!isEditMode)}
        className={`w-full mt-4 py-2.5 rounded-lg border flex items-center justify-center gap-2 transition-colors ${
          isEditMode 
            ? 'border-red-500 text-red-500 hover:bg-red-500/10' 
            : 'border-gray-500 text-gray-400 hover:bg-white/5'
        }`}
      >
        {isEditMode ? <><Lock className="w-4 h-4" /> Finalizar Configuración</> : <><Unlock className="w-4 h-4" /> Configurar Rutina</>}
      </button>

      {isEditMode && (
        <div className="mt-5 text-center">
          <label className="w-full py-2.5 rounded-lg border border-emerald-400 text-emerald-400 flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-400/10 transition-colors">
            <Upload className="w-4 h-4" /> Importar de Respaldo (CSV/JSON)
            <input tabIndex={-1} type="file" accept=".csv,.json" className="hidden" ref={fileInputRef} onChange={handleImport} />
          </label>
        </div>
      )}
        </>
      )}
        </>
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <button 
          tabIndex={-1}
          onClick={() => setIsTimerOpen(!isTimerOpen)}
          className="w-14 h-14 rounded-full bg-gray-300 text-black flex items-center justify-center shadow-lg hover:scale-95 transition-transform"
        >
          <TimerIcon className="w-6 h-6" />
        </button>
        <button 
          tabIndex={-1}
          onClick={handleExport}
          className="w-14 h-14 rounded-full bg-emerald-400 text-black flex items-center justify-center shadow-[0_4px_15px_rgba(52,211,153,0.4)] hover:scale-95 transition-transform"
        >
          <Download className="w-6 h-6" />
        </button>
      </div>

      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm relative">
            <button 
              onClick={() => setIsExportModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Exportar Datos</h2>
            <p className="text-sm text-gray-400 mb-6">
              Seleccioná en qué formato querés guardar tu respaldo. Podés usar cualquiera de los dos para luego importarlos.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => executeExport('csv')}
                className="w-full py-3 bg-black/40 border border-white/20 rounded-xl hover:bg-white/5 transition flex flex-col items-center justify-center"
              >
                <span className="font-semibold text-white">Solo CSV</span>
                <span className="text-xs text-gray-400 mt-1">Ideal para Excel / Hojas de cálculo</span>
              </button>
              <button 
                onClick={() => executeExport('json')}
                className="w-full py-3 bg-black/40 border border-white/20 rounded-xl hover:bg-white/5 transition flex flex-col items-center justify-center"
              >
                <span className="font-semibold text-white">Solo JSON</span>
                <span className="text-xs text-gray-400 mt-1">Datos estructurados puros</span>
              </button>
              <button 
                onClick={() => executeExport('both')}
                className="w-full py-3 bg-emerald-400 text-black font-semibold rounded-xl shadow-[0_0_10px_rgba(52,211,153,0.4)] transition"
              >
                Generar Ambos
              </button>
            </div>
          </div>
        </div>
      )}

      {routineForHistory && (
         <RoutineHistoryModal 
           routineId={routineForHistory.id}
           routineName={routineForHistory.title}
           routineExercises={routineForHistory.exercises || []}
           onClose={() => setRoutineForHistory(null)}
         />
      )}

      {isTimerOpen && <TimerPanel onClose={() => setIsTimerOpen(false)} />}
      
      {isAddModalOpen && (
        <AddExerciseModal 
          onClose={() => setIsAddModalOpen(false)} 
          onAdd={addExercise} 
          exerciseBank={exerciseBank}
        />
      )}
    </div>
  );
}
