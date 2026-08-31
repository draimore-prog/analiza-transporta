import fs from 'fs';

const str = fs.readFileSync('public/fleet_data.json', 'utf8');
console.log('fleet_data.json string length:', str.length);
console.log('First 500 chars:', str.substring(0, 500));
const parsed = JSON.parse(str);
console.log('Type of parsed:', typeof parsed, Array.isArray(parsed) ? 'is Array' : 'is Object');
if (!Array.isArray(parsed)) {
  console.log('Top level keys:', Object.keys(parsed));
}
