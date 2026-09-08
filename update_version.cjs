const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/Version \d+\.\d+/, 'Version 11.15');

fs.writeFileSync(path, code);

const pathImport = 'src/utils/exportImport.ts';
let codeImport = fs.readFileSync(pathImport, 'utf8');

codeImport = codeImport.replace(/version: "v\d+\.\d+"/, 'version: "v11.15"');

fs.writeFileSync(pathImport, codeImport);
