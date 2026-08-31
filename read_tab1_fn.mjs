import fs from 'fs';

const html = fs.readFileSync('public/v1.html', 'utf8');
const fnIdx = html.indexOf('function updateKPICardsTab1');
console.log(html.substring(fnIdx, fnIdx + 1500));
