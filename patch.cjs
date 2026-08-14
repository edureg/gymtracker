const fs = require('fs');

const path = 'src/utils/exportImport.ts';
let code = fs.readFileSync(path, 'utf8');

// Reverse sort keys
code = code.replace(/let keys = Object\.keys\(localStorage\)\n\s*\.filter\(k => k\.startsWith\('gym_log_'\)\)\n\s*\.sort\(\);/g, `let keys = Object.keys(localStorage)\n        .filter(k => k.startsWith('gym_log_'))\n        .sort((a, b) => b.localeCompare(a));`);

// Add metrics
code = code.replace(/content: \`Fecha: \$\{dateStr\} - Rutina: \$\{routineName\}\`,/g, `content: (() => {
                    let metricsText = "";
                    if (data.duration) metricsText += \` | \${data.duration}\`;
                    if (data.calories) metricsText += \` | \${data.calories} kcal\`;
                    if (data.avgHeartRate || data.maxHeartRate) {
                        metricsText += \` | \${data.avgHeartRate || '-'}-\${data.maxHeartRate || '-'} lpm\`;
                    }
                    return \`Fecha: \${dateStr} - Rutina: \${routineName}\${metricsText}\`;
                })(),`);

fs.writeFileSync(path, code);
