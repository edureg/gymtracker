import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, PenLine, Plus, Unlock, Lock, Download, Upload, Timer as TimerIcon } from 'lucide-react';
import { RoutineConfig, DayLog, Exercise } from './types';
import { loadRoutineConfig, saveRoutineConfig, getDayLog, saveDayLog } from './utils/storage';
import { exportCSV, importCSV } from './utils/exportImport';
import ExerciseCard from './components/ExerciseCard';
import TimerPanel from './components/TimerPanel';
import AddExerciseModal from './components/AddExerciseModal';

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [routineConfig, setRoutineConfig] = useState<RoutineConfig>({});
  const [dayLog, setDayLog] = useState<DayLog>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRoutineConfig(loadRoutineConfig());
  }, []);

  useEffect(() => {
    setDayLog(getDayLog(currentDate));
  }, [currentDate]);

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

  const handleExport = () => {
    exportCSV(routineConfig);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importCSV(file, routineConfig, () => {
        setDayLog(getDayLog(currentDate));
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
    }
  };

  const dayIndex = currentDate.getDay();
  const currentDayRoutine = routineConfig[dayIndex] || { title: 'Descanso', exercises: [] };
  
  const activeExercises = currentDayRoutine.exercises?.filter(ex => ex.isActive !== false) || [];
  const inactiveExercises = currentDayRoutine.exercises?.filter(ex => ex.isActive === false) || [];

  const moveExercise = (exIndex: number, direction: number) => {
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
      [dayIndex]: { ...currentDayRoutine, exercises: newExercises }
    };
    setRoutineConfig(newConfig);
    saveRoutineConfig(newConfig);
  };

  const toggleExerciseActive = (exId: string, isActive: boolean) => {
    const newExercises = currentDayRoutine.exercises.map(ex => 
      ex.id === exId ? { ...ex, isActive } : ex
    );
    const newConfig = {
      ...routineConfig,
      [dayIndex]: { ...currentDayRoutine, exercises: newExercises }
    };
    setRoutineConfig(newConfig);
    saveRoutineConfig(newConfig);
  };

  const changeSets = (exId: string, delta: number) => {
    const newExercises = currentDayRoutine.exercises.map(ex => {
      if (ex.id === exId) {
        const newSets = Math.max(1, ex.sets + delta);
        return { ...ex, sets: newSets };
      }
      return ex;
    });
    const newConfig = {
      ...routineConfig,
      [dayIndex]: { ...currentDayRoutine, exercises: newExercises }
    };
    setRoutineConfig(newConfig);
    saveRoutineConfig(newConfig);
  };

  const addExercise = (exercise: Exercise) => {
    const newExercises = [...(currentDayRoutine.exercises || []), exercise];
    const newConfig = {
      ...routineConfig,
      [dayIndex]: { ...currentDayRoutine, exercises: newExercises }
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

  return (
    <div className="max-w-[600px] mx-auto pb-24 px-4 pt-5">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Gym Tracker <span className="text-[0.6em] text-gray-400">v9.1</span>
        </h1>
        <div className="text-[0.7em] text-emerald-400">React v9.1 OK</div>
      </header>

      <div className="flex items-center gap-3 mb-6 bg-slate-900/70 p-3 rounded-2xl backdrop-blur-md border border-white/10">
        <button onClick={() => changeDate(-1)} className="p-2 text-emerald-400 hover:bg-white/5 rounded-lg"><ChevronLeft /></button>
        <div className="flex-grow text-center font-semibold text-lg">{dateStr}</div>
        <button onClick={() => changeDate(1)} className="p-2 text-emerald-400 hover:bg-white/5 rounded-lg"><ChevronRight /></button>
      </div>

      <div className="text-sm text-gray-400 mb-6">{currentDayRoutine.title}</div>

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

      {isEditMode && (
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full mt-5 bg-emerald-400 text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(52,211,153,0.4)]"
        >
          <Plus className="w-5 h-5" /> Añadir Ejercicio
        </button>
      )}

      <button 
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
            <Upload className="w-4 h-4" /> Importar CSV de Respaldo
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImport} />
          </label>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <button 
          onClick={() => setIsTimerOpen(!isTimerOpen)}
          className="w-14 h-14 rounded-full bg-gray-300 text-black flex items-center justify-center shadow-lg hover:scale-95 transition-transform"
        >
          <TimerIcon className="w-6 h-6" />
        </button>
        <button 
          onClick={handleExport}
          className="w-14 h-14 rounded-full bg-emerald-400 text-black flex items-center justify-center shadow-[0_4px_15px_rgba(52,211,153,0.4)] hover:scale-95 transition-transform"
        >
          <Download className="w-6 h-6" />
        </button>
      </div>

      {isTimerOpen && <TimerPanel onClose={() => setIsTimerOpen(false)} />}
      
      {isAddModalOpen && (
        <AddExerciseModal 
          onClose={() => setIsAddModalOpen(false)} 
          onAdd={addExercise} 
        />
      )}
    </div>
  );
}
