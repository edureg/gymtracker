const fs = require('fs');
const path = 'src/utils/storage.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/if \\(isMatch\\) \\{\\s*if \\(data\\.calories \\|\\| data\\.duration \\|\\| data\\.avgHeartRate \\|\\| data\\.maxHeartRate\\) \\{[\\s\\S]*?\\}\\s*\\}/, `if (isMatch) {
            return {
                date: session.dateStr,
                calories: data.calories,
                duration: data.duration,
                avgHeartRate: data.avgHeartRate,
                maxHeartRate: data.maxHeartRate
            };
        }`);

fs.writeFileSync(path, code);
