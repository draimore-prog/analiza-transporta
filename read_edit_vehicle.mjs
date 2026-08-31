import fs from 'fs';

const html = fs.readFileSync('public/v1.html', 'utf8');

// Find edit vehicle modal in html
let pos = 0;
while ((pos = html.indexOf('editVehicleModal', pos)) !== -1) {
  console.log('--- FOUND editVehicleModal at pos:', pos);
  console.log(html.substring(Math.max(0, pos - 100), pos + 1200));
  console.log('==============================================');
  pos += 16;
}

// Find openEditVehicle or saveVehicle in html
const fnIdx = html.indexOf('function openEditVehicle');
if (fnIdx !== -1) {
  console.log('--- FUNCTION openEditVehicle ---');
  console.log(html.substring(fnIdx, fnIdx + 1500));
}
