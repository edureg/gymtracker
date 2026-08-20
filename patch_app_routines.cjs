const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `<div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-bold text-gray-300">Tus Rutinas</h3>
                 <div className="flex gap-2">
                     <button 
                       onClick={() => setIsReorderingRoutines(!isReorderingRoutines)}
                       className={\`p-2 rounded-xl transition-colors cursor-pointer \${isReorderingRoutines ? 'bg-emerald-400/20 text-emerald-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'}\`}
                       title={isReorderingRoutines ? "Guardar Orden" : "Ordenar Rutinas"}
                     >
                       {isReorderingRoutines ? <Lock className="w-5 h-5" /> : <ArrowUpDown className="w-5 h-5" />}
                     </button>
                     <button 
                       onClick={createNewRoutineFromHome}
                       className="text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 p-2 rounded-xl transition-colors cursor-pointer"
                     >
                       <Plus className="w-5 h-5" />
                     </button>
                 </div>
             </div>

             {isReorderingRoutines ? (
                 <Reorder.Group 
                    axis="y" 
                    values={Object.values(routineConfig) as Routine[]} 
                    onReorder={(newRoutines) => {
                        const newConfig: RoutineConfig = {};
                        newRoutines.forEach(r => newConfig[r.id] = r);
                        setRoutineConfig(newConfig);
                        saveRoutineConfig(newConfig);
                    }} 
                    className="space-y-4"
                 >
                     {(Object.values(routineConfig) as Routine[]).map((routine) => (
                         <SortableRoutineItem 
                             key={routine.id} 
                             routine={routine} 
                             onEdit={() => {
                                 setEditingRoutineId(routine.id);
                                 setCurrentView('edit_routine');
                             }}
                             onStart={() => startRoutineToday(routine.id)}
                         />
                     ))}
                 </Reorder.Group>
             ) : (
                 <div className="space-y-4">
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
                 </div>
             )}`;

code = code.replace(/<div className="flex items-center justify-between mb-2">[\s\S]*?<\/div>\s*\)\)}/, replacement);
fs.writeFileSync(path, code);
