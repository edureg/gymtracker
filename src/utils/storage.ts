import { RoutineConfig, DayLog } from '../types';
import { DEFAULT_ROUTINE } from '../constants';
import { getLocalISODate, getDayName } from './date';

export function loadRoutineConfig(): RoutineConfig {
  const saved = localStorage.getItem('gym_custom_routine');
  if (saved) {
    return JSON.parse(saved);
  }
  const config: RoutineConfig = {};
  for (let i = 0; i <= 6; i++) {
    if (DEFAULT_ROUTINE[i]) {
      config[i] = JSON.parse(JSON.stringify(DEFAULT_ROUTINE[i]));
    } else {
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      config[i] = { title: days[i], exercises: [] };
    }
  }
  localStorage.setItem('gym_custom_routine', JSON.stringify(config));
  return config;
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

export function getLastSessionData(exerciseId: string, currentDate: Date) {
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

    const currentDayOfWeek = today.getDay();

    for (const session of pastSessions) {
        if (session.date.getDay() === currentDayOfWeek) {
            const data = JSON.parse(localStorage.getItem(session.key) || '{}');
            if (data[exerciseId]) {
                const exData = data[exerciseId];
                const hasContent = Object.keys(exData).some(k => k !== 'note' && (exData[k].weight || exData[k].reps || exData[k].time));
                if (hasContent) {
                    return { date: session.dateStr, ...exData };
                }
            }
        }
    }

    for (const session of pastSessions) {
        if (session.date.getDay() !== currentDayOfWeek) {
            const data = JSON.parse(localStorage.getItem(session.key) || '{}');
            if (data[exerciseId]) {
                const exData = data[exerciseId];
                const hasContent = Object.keys(exData).some(k => k !== 'note' && (exData[k].weight || exData[k].reps || exData[k].time));
                if (hasContent) {
                    return { date: session.dateStr + ' (' + getDayName(session.date.getDay()) + ')', ...exData };
                }
            }
        }
    }

    return null;
}
