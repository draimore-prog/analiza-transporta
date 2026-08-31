import fs from 'fs';

console.log('--- Inspecting public/fleet_master.json ---');
try {
  const master = JSON.parse(fs.readFileSync('public/fleet_master.json', 'utf8'));
  console.log('Master count:', master.length);
  console.log('Sample master item:', master[0]);
  console.log('Master keys:', Object.keys(master[0] || {}));
} catch (e) {
  console.error('Error reading fleet_master.json:', e.message);
}

console.log('\n--- Inspecting public/fleet_data.json ---');
try {
  const cost = JSON.parse(fs.readFileSync('public/fleet_data.json', 'utf8'));
  console.log('Cost count:', cost.length);
  console.log('Sample cost item:', cost[0]);
  console.log('Cost keys:', Object.keys(cost[0] || {}));
} catch (e) {
  console.error('Error reading fleet_data.json:', e.message);
}
