const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/import \{ ChevronLeft/, "import { Reorder, useDragControls } from 'motion/react';\\nimport { ChevronLeft, GripVertical, ArrowUpDown,");

fs.writeFileSync(path, code);
