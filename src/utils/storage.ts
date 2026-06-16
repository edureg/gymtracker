import { RoutineConfig, DayLog } from '../types';
import { DEFAULT_ROUTINE } from '../constants';
import { getLocalISODate, getDayName } from './date';

export function loadRoutineConfig(): RoutineConfig {
  const saved = localStorage.getItem('gym_custom_routine');
  if (saved) {
    const parsed = JSON.parse(saved);
    const keys = Object.keys(parsed);
    const isOldFormat = keys.some(k => !isNaN(Number(k)) && parseInt(k) >= 0 && parseInt(k) <= 6);
    
    if (isOldFormat) {
      console.log("Migrando rutinas al nuevo formato libre...");
      const migrated: RoutineConfig = {};
      let counter = 1;
      
      [1, 2, 3, 4, 5, 6, 0].forEach(dayNum => {
        const oldRoutine = parsed[dayNum.toString()] || parsed[dayNum];
        if (oldRoutine && oldRoutine.exercises && oldRoutine.exercises.length > 0) {
          const newId = `routine_${counter}`;
          migrated[newId] = {
            id: newId,
            title: oldRoutine.title || `Rutina ${counter}`,
            exercises: oldRoutine.exercises
          };
          counter++;
        }
      });
      
      if (Object.keys(migrated).length === 0) {
          // Si no había nada de nada, creamos una de muestra
          migrated['routine_1'] = { id: 'routine_1', title: 'Rutina 1', exercises: [] };
      }
      localStorage.setItem('gym_custom_routine', JSON.stringify(migrated));
      return migrated;
    }
    return parsed;
  }
  
  const defaultConfig: RoutineConfig = {
    'routine_1': { id: 'routine_1', title: 'Rutina 1', exercises: [] }
  };
  localStorage.setItem('gym_custom_routine', JSON.stringify(defaultConfig));
  return defaultConfig;
}

export function saveRoutineConfig(config: RoutineConfig) {
  localStorage.setItem('gym_custom_routine', JSON.stringify(config));
}

export function getDayLog(date: Date): DayLog {
  const key = `gym_log_${getLocalISODate(date)}`;
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : {};
}

export function saveDayLog(date: Date, log: DayLog) {
  const key = `gym_log_${getLocalISODate(date)}`;
  localStorage.setItem(key, JSON.stringify(log));
}

export function getLastSessionData(exerciseId: string, exerciseName: string, currentDate: Date) {
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);

    const keys = Object.keys(localStorage).filter(k => k.startsWith('gym_log_'));

    const history = keys.map(key => {
        const dateStr = key.replace('gym_log_', '');
        const parts = dateStr.split('-');
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return { date, key, dateStr };
    });

    const pastSessions = history
        .filter(h => h.date < today)
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    const routineConfig = JSON.parse(localStorage.getItem('gym_custom_routine') || '{}');
    const idToNameMap: Record<string, string> = {};
    Object.values(routineConfig).forEach((r: any) => {
        if (r.exercises) {
            r.exercises.forEach((ex: any) => {
                idToNameMap[ex.id] = ex.name;
            });
        }
    });
    Object.values(DEFAULT_ROUTINE).forEach((r: any) => {
        if (r.exercises) {
            r.exercises.forEach((ex: any) => {
                idToNameMap[ex.id] = ex.name;
            });
        }
    });

    const possibleIds = Object.keys(idToNameMap).filter(id => idToNameMap[id] === exerciseName);
    if (!possibleIds.includes(exerciseId)) possibleIds.push(exerciseId);

    for (const session of pastSessions) {
        const data = JSON.parse(localStorage.getItem(session.key) || '{}');
        
        let foundData = null;
        for (const pid of possibleIds) {
            if (data[pid]) {
                foundData = data[pid];
                break;
            }
        }

        if (foundData) {
            const hasContent = Object.keys(foundData).some(k => k !== 'note' && (foundData[k].weight || foundData[k].reps || foundData[k].time));
            if (hasContent) {
                return { date: session.dateStr, ...foundData };
            }
        }
    }

    return null;
}

export function getLastDayMetrics(currentDate: Date, routine: any) {
    if (!routine) return null;
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);

    const keys = Object.keys(localStorage).filter(k => k.startsWith('gym_log_'));

    const history = keys.map(key => {
        const dateStr = key.replace('gym_log_', '');
        const parts = dateStr.split('-');
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return { date, key, dateStr };
    });

    const pastSessions = history
        .filter(h => h.date < today)
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    const routineExIds = routine.exercises ? routine.exercises.map((ex: any) => ex.id) : [];

    for (const session of pastSessions) {
        const data = JSON.parse(localStorage.getItem(session.key) || '{}');
        
        let isMatch = false;
        if (data.routineId) {
            isMatch = data.routineId === routine.id;
        } else {
            const logExerciseIds = Object.keys(data).filter(k => 
                !['_day_note_', 'calories', 'duration', 'avgHeartRate', 'maxHeartRate', 'routineId'].includes(k)
            );
            isMatch = logExerciseIds.some(id => routineExIds.includes(id));
        }

        if (isMatch) {
            if (data.calories || data.duration || data.avgHeartRate || data.maxHeartRate) {
                return {
                    date: session.dateStr,
                    calories: data.calories,
                    duration: data.duration,
                    avgHeartRate: data.avgHeartRate,
                    maxHeartRate: data.maxHeartRate
                };
            }
        }
    }

    return null;
}
