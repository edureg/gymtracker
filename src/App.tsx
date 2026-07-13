import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, PenLine, Plus, Unlock, Lock, Download, Upload, Timer as TimerIcon, History, X, Home, Calendar, CheckCircle, Settings } from 'lucide-react';
import { RoutineConfig, DayLog, Exercise, Routine } from './types';
import { loadRoutineConfig, saveRoutineConfig, getDayLog, saveDayLog, getLastDayMetrics } from './utils/storage';
import { exportCSV, exportJSON, exportPDF, importFile } from './utils/exportImport';
import ExerciseCard from './components/ExerciseCard';
import TimerPanel from './components/TimerPanel';
import AddExerciseModal from './components/AddExerciseModal';
import RoutineHistoryModal from './components/RoutineHistoryModal';
import EditRoutineView from './components/EditRoutineView';
import CalendarView from './components/CalendarView';

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [routineConfig, setRoutineConfig] = useState<RoutineConfig>({});
  const [dayLog, setDayLog] = useState<DayLog>({});
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportRangeType, setExportRangeType] = useState<'30_days' | 'custom' | 'all'>('30_days');
  const [exportStartDate, setExportStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [exportEndDate, setExportEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [routineForHistory, setRoutineForHistory] = useState<Routine | null>(null);
  const [currentView, _setCurrentView] = useState<'home' | 'workout' | 'edit_routine' | 'calendar'>('home');
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);

  const unlinkRoutineFromDayRef = useRef<() => void>(() => {});
  const currentLogHasDataRef = useRef(false);
  const currentViewRef = useRef(currentView);
  const editingRoutineIdRef = useRef(editingRoutineId);
  const routineConfigRef = useRef(routineConfig);

  useEffect(() => {
    currentLogHasDataRef.current = currentLogHasData;
    currentViewRef.current = currentView;
    unlinkRoutineFromDayRef.current = unlinkRoutineFromDay;
    editingRoutineIdRef.current = editingRoutineId;
    routineConfigRef.current = routineConfig;
  });

  const setCurrentView = (view: 'home' | 'workout' | 'edit_routine' | 'calendar') => {
    _setCurrentView((prev) => {
      if (prev !== view) {
        window.history.pushState({ view }, '', view === 'home' ? window.location.pathname : '#' + view);
      }
      return view;
    });
  };

  const openHistoryModal = (routine: Routine) => {
      setRoutineForHistory(routine);
      window.history.pushState({ modal: 'history', view: currentView }, '', '#history');
  };

  const closeHistoryModal = () => {
      setRoutineForHistory(null);
      if (window.history.state?.modal === 'history') {
          window.history.back();
      }
  };

  const openExportModal = () => {
      setIsExportModalOpen(true);
      window.history.pushState({ modal: 'export', view: currentView }, '', '#export');
  };

  const closeExportModal = () => {
      setIsExportModalOpen(false);
      if (window.history.state?.modal === 'export') {
          window.history.back();
      }
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (routineForHistory || isExportModalOpen) {
          setRoutineForHistory(null);
          setIsExportModalOpen(false);
      }

      let nextView = 'home';
      if (e.state && e.state.view) {
        nextView = e.state.view;
      } else if (window.location.hash) {
        const hashView = window.location.hash.substring(1) as any;
        if (['home', 'workout', 'edit_routine', 'calendar'].includes(hashView)) {
           nextView = hashView;
        }
      }
      
      if (currentViewRef.current === 'workout' && nextView === 'home' && !currentLogHasDataRef.current) {
          unlinkRoutineFromDayRef.current();
      }

      if (currentViewRef.current === 'edit_routine' && editingRoutineIdRef.current) {
          const r = routineConfigRef.current[editingRoutineIdRef.current];
          if (r && r.title === 'Nueva Rutina' && (!r.exercises || r.exercises.length === 0)) {
              const newConf = { ...routineConfigRef.current };
              delete newConf[editingRoutineIdRef.current];
              setRoutineConfig(newConf);
              saveRoutineConfig(newConf);
          }
          setEditingRoutineId(null);
      }

      _setCurrentView(nextView as any);
    };
    window.addEventListener('popstate', handlePopState);
    if (!window.location.hash || window.location.hash === '#home') {
        window.history.replaceState({ view: 'home' }, '', window.location.pathname);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Compute Exercise Bank (all unique exercises across all days)
  const allExercisesMap = new Map<string, Exercise>();
  (Object.values(routineConfig) as Routine[]).forEach(day => {
    day.exercises?.forEach(ex => {
      if (!allExercisesMap.has(ex.id)) {
        allExercisesMap.set(ex.id, ex);
      }
    });
  });

  let activeRoutineId = currentView === 'edit_routine' ? editingRoutineId : dayLog.routineId;

  let currentLogHasData = false;
  if (dayLog) {
     for (const key of Object.keys(dayLog)) {
        if (!['routineId', '_day_note_', 'calories', 'duration', 'avgHeartRate', 'maxHeartRate'].includes(key)) {
           const exData = dayLog[key];
           for (const setKey of Object.keys(exData)) {
              if (setKey !== 'note' && (exData[setKey].reps || exData[setKey].weight || exData[setKey].time || exData[setKey].done)) {
                 currentLogHasData = true;
                 break;
              }
           }
        }
     }
  }

  let currentDayRoutine = activeRoutineId ? routineConfig[activeRoutineId] : null;

  if (!currentDayRoutine && currentLogHasData) {
      activeRoutineId = "historic_imported";
      
      const historicExercises: Exercise[] = [];
      Object.keys(dayLog).forEach(key => {
          if (!['routineId', '_day_note_', 'calories', 'duration', 'avgHeartRate', 'maxHeartRate'].includes(key)) {
              const existingEx = allExercisesMap.get(key);
              historicExercises.push(existingEx || {
                  id: key,
                  name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  notes: '',
                  sets: Object.keys(dayLog[key]).filter(k => k !== 'note').length || 1,
              });
          }
      });
      
      currentDayRoutine = {
          id: "historic_imported",
          title: "Histórico Libre",
          exercises: historicExercises,
      };
  }

  const lastDayMetrics = getLastDayMetrics(currentDate, currentDayRoutine);

  useEffect(() => {
    setRoutineConfig(loadRoutineConfig());
  }, [refreshTrigger]);

  useEffect(() => {
    const log = getDayLog(currentDate);
    const routines = loadRoutineConfig();
    
    // SELF HEALING FOR CORRUPTED routineId
    const loggedExerciseIds = Object.keys(log).filter(key => 
        !['routineId', '_day_note_', 'calories', 'duration', 'avgHeartRate', 'maxHeartRate'].includes(key) &&
        Object.keys(log[key]).some(setKey => setKey !== 'note' && (log[key][setKey].reps || log[key][setKey].weight || log[key][setKey].time || log[key][setKey].done))
    );

    if (loggedExerciseIds.length > 0 && log.routineId && routines[log.routineId]) {
        const currentRoutineExIds = routines[log.routineId].exercises.map((e: any) => e.id);
        const hasMatchingEx = loggedExerciseIds.some(id => currentRoutineExIds.includes(id));
        
        if (!hasMatchingEx) {
            let bestMatchId = null;
            let bestMatchCount = 0;
            for (const rId of Object.keys(routines)) {
                if (rId === log.routineId) continue;
                const rExIds = routines[rId].exercises.map((e: any) => e.id);
                const matchCount = loggedExerciseIds.filter(id => rExIds.includes(id)).length;
                if (matchCount > bestMatchCount) {
                    bestMatchCount = matchCount;
                    bestMatchId = rId;
                }
            }
            if (bestMatchId) {
                log.routineId = bestMatchId;
                saveDayLog(currentDate, log);
            }
        }
    }

    setDayLog(log);
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
    openExportModal();
  };

  const executeExport = (type: 'csv' | 'json' | 'pdf' | 'all') => {
    let startStr: string | undefined;
    let endStr: string | undefined;

    if (exportRangeType === '30_days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startStr = d.toISOString().split('T')[0];
    } else if (exportRangeType === 'custom') {
      startStr = exportStartDate;
      endStr = exportEndDate;
    }

    if (type === 'csv' || type === 'all') {
      exportCSV(routineConfig, startStr, endStr);
    }
    if (type === 'json' || type === 'all') {
      exportJSON(routineConfig, startStr, endStr);
    }
    if (type === 'pdf' || type === 'all') {
      exportPDF(routineConfig, startStr, endStr);
    }
    closeExportModal();
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
                  if (setKey !== 'note' && (exData[setKey].reps || exData[setKey].weight || exData[setKey].time || exData[setKey].done)) {
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
    
    // Switch to edit routine view for the new template
    setEditingRoutineId(rId);
    setCurrentView('edit_routine');
  };

  const todayDateObj = new Date();
  const todayLogState = getDayLog(todayDateObj);
  const todayRoutineId = todayLogState.routineId;
  const todayRoutineObjRaw = todayRoutineId ? routineConfig[todayRoutineId] : null;
  const todayHasFinishedMetrics = !!(todayLogState.calories || todayLogState.duration || todayLogState.avgHeartRate || todayLogState.maxHeartRate);

  let todayHasExerciseData = false;
  if (todayLogState) {
    for (const key of Object.keys(todayLogState)) {
      if (!['routineId', '_day_note_', 'calories', 'duration', 'avgHeartRate', 'maxHeartRate'].includes(key)) {
         const exData = todayLogState[key];
         for (const setKey of Object.keys(exData)) {
            if (setKey !== 'note' && (exData[setKey].reps || exData[setKey].weight || exData[setKey].time || exData[setKey].done)) {
               todayHasExerciseData = true;
               break;
            }
         }
      }
      if (todayHasExerciseData) break;
    }
  }

  const todayRoutineObj = (todayHasExerciseData || todayHasFinishedMetrics) ? todayRoutineObjRaw : null;

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

  // Filter out exercises that are already active TODAY
  const activeIdsToday = new Set(activeExercises.map(e => e.id));
  const exerciseBank = Array.from(allExercisesMap.values()).filter(ex => !activeIdsToday.has(ex.id));

  return (
    <div className="max-w-[600px] mx-auto pb-24 px-4 pt-5">
      {currentView === 'home' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <header className="flex justify-between items-end mb-8 pt-2">
            <div>
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent mb-1">
                Gym Tracker
              </h1>
              <div className="text-xs font-semibold text-emerald-400/80 tracking-widest uppercase">Version 11.0</div>
            </div>
            <button 
              onClick={openExportModal}
              className="p-3 bg-slate-900 border border-white/10 rounded-xl hover:bg-white/5 transition-colors shadow-sm cursor-pointer"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          </header>

          {todayRoutineObj ? (
             todayHasFinishedMetrics ? (
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 p-6 rounded-3xl mb-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
                   <div className="absolute inset-0 bg-[linear-gradient(to_right,#34d39911_1px,transparent_1px),linear-gradient(to_bottom,#34d39911_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>
                   <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 z-10">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                   </div>
                   <h2 className="text-emerald-400 text-xl font-black mb-1 z-10">¡Entrenamiento de Hoy Finalizado!</h2>
                   <p className="text-gray-300 font-medium mb-6 z-10">{todayRoutineObj.title}</p>
                   <button 
                      onClick={() => {
                         setCurrentDate(new Date());
                         setCurrentView('workout');
                      }}
                      className="w-full py-3.5 bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-400/30 font-bold rounded-xl hover:bg-emerald-400/10 transition-colors z-10"
                   >
                      Ver / Editar Registro
                   </button>
                </div>
             ) : (
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-1 rounded-3xl mb-10 shadow-[0_0_40px_rgba(52,211,153,0.3)]">
                   <div className="bg-slate-900/90 rounded-[22px] p-6 backdrop-blur-xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl"></div>
                       <h2 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                           <TimerIcon className="w-5 h-5" /> Entrenamiento en curso
                       </h2>
                       <p className="text-white text-2xl font-black mb-6">{todayRoutineObj.title}</p>
                       <button 
                          onClick={() => {
                             setCurrentDate(new Date());
                             setCurrentView('workout');
                          }}
                          className="w-full py-4 bg-emerald-400 text-black font-black text-lg rounded-xl shadow-lg hover:bg-emerald-300 transition-colors"
                       >
                          Continuar Entrenamiento
                       </button>
                   </div>
                </div>
             )
          ) : (
             <div className="mb-10 pl-2 border-l-4 border-emerald-400/50">
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">¿Qué entrenamos hoy?</h2>
                <p className="text-gray-400 text-sm">Selecciona una rutina para comenzar.</p>
             </div>
          )}

          <div className="space-y-5">
             <div className="flex items-center justify-between mb-2">
                 <h3 className="text-lg font-bold text-gray-300">Tus Rutinas</h3>
                 <button 
                   onClick={createNewRoutineFromHome}
                   className="text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 p-2 rounded-xl transition-colors cursor-pointer"
                 >
                   <Plus className="w-5 h-5" />
                 </button>
             </div>

             {(Object.values(routineConfig) as Routine[]).map((routine: Routine) => (
                <div key={routine.id} className="bg-slate-900 border border-white/5 rounded-3xl p-5 flex flex-col gap-4 hover:border-white/10 transition-colors group">
                   <div className="flex justify-between items-start">
                      <div>
                          <h4 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors mb-1">{routine.title}</h4>
                          <div className="text-sm text-gray-500">{routine.exercises?.filter(e => e.isActive !== false).length || 0} ejercicios</div>
                      </div>
                      <button 
                          onClick={() => {
                              setEditingRoutineId(routine.id);
                              setCurrentView('edit_routine');
                          }}
                          className="bg-black/40 text-gray-400 hover:text-white p-2.5 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer"
                          title="Editar Plantilla"
                      >
                          <PenLine className="w-4 h-4" />
                      </button>
                   </div>
                   
                   <div className="flex gap-2">
                      <button 
                         onClick={() => startRoutineToday(routine.id)}
                         className="flex-1 py-3 bg-white/5 text-emerald-400 border border-emerald-400/20 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-400/10 transition-colors"
                      >
                         Entrenar Hoy
                      </button>
                      <button 
                         onClick={() => openHistoryModal(routine)}
                         className="px-4 py-3 bg-black/40 text-gray-300 border border-white/5 rounded-xl font-semibold flex items-center justify-center hover:bg-white/10 transition-colors"
                         title="Historial de esta rutina"
                      >
                         <History className="w-5 h-5" />
                      </button>
                   </div>
                </div>
             ))}
             
             {Object.keys(routineConfig).length === 0 && (
                 <div className="text-center py-12 px-4 bg-slate-900/50 border border-dashed border-white/10 rounded-3xl">
                     <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                         <PenLine className="w-8 h-8 text-gray-500" />
                     </div>
                     <h3 className="text-lg font-bold text-gray-300 mb-2">No tienes rutinas</h3>
                     <p className="text-sm text-gray-500 mb-6">Crea tu primera plantilla de ejercicios para empezar a registrar.</p>
                     <button 
                         onClick={createNewRoutineFromHome}
                         className="px-6 py-3 bg-emerald-400 text-black font-bold rounded-xl shadow-lg hover:bg-emerald-300 transition-colors"
                     >
                         Crear Primera Rutina
                     </button>
                 </div>
             )}
          </div>

          <div className="mt-12 text-center pb-8 border-t border-white/10 pt-8">
             <button
                onClick={() => setCurrentView('calendar')}
                className="text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto bg-black/30 py-3 px-6 rounded-2xl border border-white/5 cursor-pointer"
             >
                <Calendar className="w-4 h-4"/> Ver Calendario / Días pasados
             </button>
          </div>
        </div>
      ) : currentView === 'calendar' ? (
          <CalendarView 
              initialDate={currentDate}
              onSelectDate={(date) => {
                  setCurrentDate(date);
                  setCurrentView('workout');
              }}
              onClose={() => setCurrentView('home')}
          />
      ) : currentView === 'edit_routine' && editingRoutineId ? (
          <EditRoutineView 
              routine={routineConfig[editingRoutineId]}
              exerciseBank={Array.from(allExercisesMap.values())}
              onUpdate={(updated) => {
                 const newConf = {...routineConfig, [updated.id]: updated};
                 setRoutineConfig(newConf);
                 saveRoutineConfig(newConf);
              }}
              onClose={() => {
                  if (editingRoutineId) {
                      const r = routineConfig[editingRoutineId];
                      if (r && r.title === 'Nueva Rutina' && (!r.exercises || r.exercises.length === 0)) {
                          const newConf = { ...routineConfig };
                          delete newConf[editingRoutineId];
                          setRoutineConfig(newConf);
                          saveRoutineConfig(newConf);
                      }
                  }
                  setCurrentView('home');
                  setEditingRoutineId(null);
              }}
              onDelete={() => {
                 const newConf = {...routineConfig};
                 delete newConf[editingRoutineId];
                 setRoutineConfig(newConf);
                 saveRoutineConfig(newConf);
                 
                 // if deleted routine was today's routine, unlink it
                 const tLog = getDayLog(currentDate);
                 if (tLog.routineId === editingRoutineId) {
                     const newLog = { ...tLog };
                     delete newLog.routineId;
                     setDayLog(newLog);
                     saveDayLog(currentDate, newLog);
                 }

                 setCurrentView('home');
                 setEditingRoutineId(null);
              }}
          />
      ) : (
        <>
          <header className="flex justify-between items-center mb-6">
            <button 
              onClick={() => {
                if (!currentLogHasData) {
                    unlinkRoutineFromDay();
                }
                setCurrentView('home');
              }}
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
        <button 
          tabIndex={-1} 
          onClick={() => changeDate(1)} 
          disabled={isToday}
          className={`p-2 rounded-lg ${isToday ? 'text-gray-600 cursor-not-allowed opacity-50' : 'text-emerald-400 hover:bg-white/5'}`}
        >
          <ChevronRight />
        </button>
      </div>

        {Object.keys(routineConfig).length > 0 && !activeRoutineId ? (
            <div className="text-center py-10">
              <h2 className="text-xl font-bold mb-6 text-emerald-400">¿Qué rutina vas a hacer este día?</h2>
              <div className="space-y-4 px-4">
                {(Object.values(routineConfig) as Routine[]).map((routine: Routine) => (
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
              <div className="text-xl font-bold text-emerald-400 flex flex-wrap items-center gap-2">
                  <span>{currentDayRoutine?.title}</span>
                  <div className="flex gap-1 ml-auto">
                    <button 
                      onClick={() => openHistoryModal(currentDayRoutine)}
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
              isEditMode={false}
              onUpdateLog={(setIdx, field, val) => updateExerciseLog(ex.id, setIdx, field, val)}
              onToggleSet={(setIdx) => toggleSetDone(ex.id, setIdx)}
              onUpdateNote={(note) => updateSessionNote(ex.id, note)}
              onMoveUp={() => {}}
              onMoveDown={() => {}}
              canMoveUp={false}
              canMoveDown={false}
              onDeactivate={() => {}}
              onChangeSets={() => {}}
              onUpdateExerciseNotes={() => {}}
            />
          ))
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
      </div>

      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm relative">
            <button 
              onClick={closeExportModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Exportar / Restaurar</h2>
            <p className="text-sm text-gray-400 mb-4">
              Seleccioná qué datos y en qué formato querés guardar tu respaldo.
            </p>

            <div className="mb-6 space-y-3">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="radio" name="exportRange" checked={exportRangeType === '30_days'} onChange={() => setExportRangeType('30_days')} className="accent-emerald-400" />
                  Últimos 30 días
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="radio" name="exportRange" checked={exportRangeType === 'all'} onChange={() => setExportRangeType('all')} className="accent-emerald-400" />
                  Todos los registros
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="radio" name="exportRange" checked={exportRangeType === 'custom'} onChange={() => setExportRangeType('custom')} className="accent-emerald-400" />
                  Rango personalizado
                </label>
              </div>

              {exportRangeType === 'custom' && (
                <div className="flex gap-3 mt-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Desde</label>
                    <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-2 text-sm text-white focus:outline-none focus:border-emerald-400/50" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                    <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-2 text-sm text-white focus:outline-none focus:border-emerald-400/50" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => executeExport('pdf')}
                className="w-full py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition flex flex-col items-center justify-center"
              >
                <span className="font-semibold flex items-center gap-2">Reporte en PDF</span>
                <span className="text-xs text-red-400/70 mt-1">Ideal para leer o imprimir</span>
              </button>
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
                <span className="text-xs text-gray-400 mt-1">Para restaurar en Gym Tracker</span>
              </button>
              <button 
                onClick={() => executeExport('all')}
                className="w-full py-3 bg-emerald-400 text-black font-semibold rounded-xl shadow-[0_0_10px_rgba(52,211,153,0.4)] transition"
              >
                Generar Todos
              </button>
              
              <div className="pt-4 mt-4 border-t border-white/10">
                 <h3 className="text-sm font-semibold text-gray-300 mb-3 text-center">Restaurar Datos (Importar)</h3>
                 <label className="w-full py-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition flex flex-col items-center justify-center cursor-pointer">
                    <span className="font-semibold flex items-center gap-2">
                       <Upload className="w-5 h-5" /> Importar Backup
                    </span>
                    <span className="text-xs text-blue-400/70 mt-1">Soporta .json, .csv o .txt</span>
                    <input 
                      type="file" 
                      accept=".csv,.json,.txt"
                      className="hidden"
                      onChange={handleImport}
                    />
                 </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {routineForHistory && (
         <RoutineHistoryModal 
           routineId={routineForHistory.id}
           routineName={routineForHistory.title}
           routineExercises={routineForHistory.exercises || []}
           onClose={closeHistoryModal}
         />
      )}

      {isTimerOpen && <TimerPanel onClose={() => setIsTimerOpen(false)} />}
    </div>
  );
}
