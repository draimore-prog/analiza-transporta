import fs from 'fs';
import { cleanVehicleType } from './src/lib/calculations.js';

const masterRaw = JSON.parse(fs.readFileSync('public/fleet_master.json', 'utf8'));
const masterFleet = Array.isArray(masterRaw) ? masterRaw : (masterRaw.records || []);

console.log('Master Fleet loaded:', masterFleet.length);

const costRaw = JSON.parse(fs.readFileSync('public/fleet_data.json', 'utf8'));
const costArray = Array.isArray(costRaw) ? costRaw : (costRaw.records || []);

const parsedCosts = costArray.map(c => {
  let datumObj = null;
  if (c.datum) {
    datumObj = new Date(c.datum);
  }
  return {
    ...c,
    datumObj,
    cost: parseFloat(c.cost || 0) || 0,
    year: parseInt(c.year) || (datumObj ? datumObj.getFullYear() : 2026),
    month: parseInt(c.month) || (datumObj ? datumObj.getMonth() + 1 : 1),
    tipMehan: cleanVehicleType(c.tipMehan)
  };
});

console.log('Parsed Costs count:', parsedCosts.length);
console.log('Cost sum total:', parsedCosts.reduce((acc, c) => acc + c.cost, 0).toLocaleString('bs-BA'), 'KM');

// Breakdown by year
const byYear = {};
parsedCosts.forEach(c => {
  byYear[c.year] = (byYear[c.year] || 0) + c.cost;
});
console.log('Cost by year:', byYear);

// Warehouse costs
const whCosts = parsedCosts.filter(c => {
  const t = (c.tipMehan || '').toLowerCase();
  return t.includes('skladi') || t.includes('viljuš') || t.includes('viljusk');
});
console.log('Warehouse costs count:', whCosts.length);
console.log('Warehouse cost sum:', whCosts.reduce((acc, c) => acc + c.cost, 0).toLocaleString('bs-BA'), 'KM');
