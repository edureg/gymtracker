import React, { useState, useEffect } from 'react';
import { X, CalendarIcon, Timer, Heart, Activity } from 'lucide-react';
import { Exercise } from '../types';

interface Props {
    routineId: string;
    routineName: string;
    routineExercises: Exercise[];
    onClose: () => void;
}

export default function RoutineHistoryModal({ routineId, routineName, routineExercises, onClose }: Props) {
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('gym_log_'));
        const matched = [];
        const routineExIds = routineExercises.map(ex => ex.id);
        
        for (const key of keys) {
            const dateStr = key.replace('gym_log_', '');
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            
            let isMatch = false;
            if (data.routineId) {
                isMatch = data.routineId === routineId;
            } else {
                // Fallback for older logs before routineId existed
                const logExerciseIds = Object.keys(data).filter(k => 
                    !['_day_note_', 'calories', 'duration', 'avgHeartRate', 'maxHeartRate', 'routineId'].includes(k)
                );
                // Check if the log shares at least one exercise with the current routine
                isMatch = logExerciseIds.some(id => routineExIds.includes(id));
            }

            if (isMatch) {
                matched.push({
                    date: dateStr,
                    calories: data.calories || '-',
                    duration: data.duration || '-',
                    avgHeartRate: data.avgHeartRate || '-',
                    maxHeartRate: data.maxHeartRate || '-'
                });
            }
        }
        
        matched.sort((a, b) => {
            // Sort by ISO date descending
            const parseDate = (d: string) => {
                const parts = d.split('-');
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
            };
            return parseDate(b.date) - parseDate(a.date);
        });

        setHistory(matched);
    }, [routineId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="bg-black/40 p-4 border-b border-white/10 flex justify-between items-center sticky top-0">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
                        <Activity className="w-5 h-5" /> 
                        Historial <span className="text-gray-300 text-sm ml-1 font-normal overflow-hidden overflow-ellipsis whitespace-nowrap max-w-[150px]">({routineName})</span>
                    </h2>
                    <button onClick={onClose} className="p-1.5 bg-white/5 rounded-lg text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto space-y-3">
                    {history.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            No se encontraron registros de esta rutina.
                        </div>
                    ) : (
                        history.map((record, i) => (
                            <div key={i} className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col gap-2">
                                <div className="flex items-center text-emerald-400 font-semibold mb-1 border-b border-white/5 pb-2">
                                    <CalendarIcon className="w-4 h-4 mr-2" />
                                    {record.date}
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm mt-1">
                                    <div>
                                        <span className="text-gray-500 block text-xs">Duración</span>
                                        <span className="text-gray-200 flex items-center gap-1"><Timer className="w-3 h-3 text-emerald-400/70"/> {record.duration}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs">Calorías</span>
                                        <span className="text-gray-200">{record.calories} kcal</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs">FC Promedio</span>
                                        <span className="text-gray-200 flex items-center gap-1"><Heart className="w-3 h-3 text-red-400/70"/> {record.avgHeartRate} ppm</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs">FC Máxima</span>
                                        <span className="text-gray-200">{record.maxHeartRate} ppm</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
