import fs from 'fs';

const parsed = JSON.parse(fs.readFileSync('public/fleet_data.json', 'utf8'));
console.log('Total records:', parsed.records?.length);
console.log('Sample record 0:', parsed.records[0]);
console.log('Sample record 1:', parsed.records[1]);
console.log('Metadata:', parsed.metadata);
