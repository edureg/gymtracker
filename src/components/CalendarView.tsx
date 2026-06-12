import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Dumbbell } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  initialDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

export default function CalendarView({ initialDate, onSelectDate, onClose }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [trainedDays, setTrainedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Scan local storage for trained days
    const activeDays = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && /^\d{4}-\d{2}-\d{2}$/.test(key)) {
            try {
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                // Check if it has actual data (routineId, metrics, or exercises)
                const hasData = Object.keys(data).some(k => k !== '_day_note_');
                if (hasData) {
                    activeDays.add(key);
                }
            } catch (e) {
                // ignore
            }
        }
    }
    setTrainedDays(activeDays);
  }, []);

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0 is Sunday
  
  // Calculate days for the calendar grid (including previous/next month filler days)
  const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
  
  const days = [];
  
  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
          date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, prevMonthDays - i),
          isCurrentMonth: false
      });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
      days.push({
          date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i),
          isCurrentMonth: true
      });
  }
  
  // Next month days to complete 6 rows (42 days total)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
      days.push({
          date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i),
          isCurrentMonth: false
      });
  }

  const weekDays = ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sa'];
  
  const formatDateForStorage = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = formatDateForStorage(new Date());

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-[400px] mx-auto pb-24 px-4 pt-5"
    >
      <header className="flex justify-between items-center mb-6">
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl transition-colors">
          <X className="w-6 h-6" />
        </button>
        <span className="font-bold text-gray-200">Calendario</span>
        <div className="w-10"></div> {/* Spacer */}
      </header>
      
      <div className="bg-slate-900 border border-white/10 rounded-[28px] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white capitalize">
                {currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 text-gray-400 hover:text-white bg-black/40 hover:bg-white/10 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextMonth} className="p-2 text-gray-400 hover:text-white bg-black/40 hover:bg-white/10 rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-bold text-emerald-400/80 uppercase tracking-widest">
                    {day}
                </div>
            ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
            {days.map((dayObj, i) => {
                const dateStr = formatDateForStorage(dayObj.date);
                const isToday = dateStr === todayStr;
                const isTrained = trainedDays.has(dateStr);
                
                return (
                    <button
                        key={i}
                        onClick={() => onSelectDate(dayObj.date)}
                        className={`
                            relative aspect-square flex items-center justify-center rounded-2xl text-sm font-semibold transition-all
                            ${dayObj.isCurrentMonth ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'}
                            ${isToday && !isTrained ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/50' : ''}
                            ${isTrained ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:bg-emerald-400' : ''}
                        `}
                    >
                        {dayObj.date.getDate()}
                        {isTrained && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-black/40"></div>}
                    </button>
                );
            })}
        </div>
        
        <div className="mt-6 flex flex-col gap-3 border-t border-white/5 pt-4">
            <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-3 h-3 rounded-md bg-emerald-500"></div> Día con entrenamiento
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-3 h-3 rounded-md bg-emerald-400/20 border border-emerald-400/50"></div> Hoy
            </div>
        </div>
      </div>
    </motion.div>
  );
}
