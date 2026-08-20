const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const sortableItem = `function SortableRoutineItem({ routine, onEdit, onStart }: { routine: Routine, onEdit: () => void, onStart: () => void }) {
    const controls = useDragControls();
    return (
        <Reorder.Item value={routine} dragListener={false} dragControls={controls}>
            <div className="bg-slate-900 border border-white/5 rounded-3xl p-4 flex gap-4 hover:border-white/10 transition-colors group mb-4">
                <div 
                    onPointerDown={(e) => controls.start(e)}
                    className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 p-2 touch-none"
                >
                    <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors mb-1">{routine.title}</h4>
                            <div className="text-sm text-gray-500">{routine.exercises?.filter(e => e.isActive !== false).length || 0} ejercicios</div>
                        </div>
                        <button onClick={onEdit} className="bg-black/40 text-gray-400 hover:text-white p-2.5 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer">
                            <PenLine className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </Reorder.Item>
    );
}

export default function App() {`;

code = code.replace("export default function App() {", sortableItem);
fs.writeFileSync(path, code);
