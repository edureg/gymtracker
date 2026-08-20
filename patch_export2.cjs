const fs = require('fs');

const path = 'src/utils/exportImport.ts';
let code = fs.readFileSync(path, 'utf8');

// exportCSV
code = code.replace(/const link = document\.createElement\("a"\);[\s\S]*?document\.body\.removeChild\(link\);/, `const fileName = \`gym_export_\${new Date().toISOString().split('T')[0]}.csv\`;
    shareOrDownloadFile(fileName, blob);`);

// exportJSON
code = code.replace(/const link = document\.createElement\("a"\);[\s\S]*?document\.body\.removeChild\(link\);/, `const fileName = \`gym_export_\${new Date().toISOString().split('T')[0]}.json\`;
    shareOrDownloadFile(fileName, blob);`);

fs.writeFileSync(path, code);
