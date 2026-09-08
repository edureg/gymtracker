const fs = require('fs');
const path = 'src/utils/storage.ts';
let code = fs.readFileSync(path, 'utf8');

const newCode = `
export function deleteMasterExercise(id: string) {
    const master = getMasterExercises();
    if (master[id]) {
        delete master[id];
        saveMasterExercises(master);
    }
}
`;

code += newCode;
fs.writeFileSync(path, code);
