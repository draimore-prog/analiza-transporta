import fs from 'fs';

const html = fs.readFileSync('public/v1.html', 'utf8');

// Find all modals
const modals = [];
let reModal = /id="([^"]*Modal[^"]*)"/gi;
let m;
while ((m = reModal.exec(html)) !== null) {
  if (!modals.includes(m[1])) modals.push(m[1]);
}
console.log('--- MODALS IN V1 ---');
console.log(modals);

// Find all functions with open/close
const funcs = [];
let reFunc = /function\s+((?:open|close|switch|render|draw|handle)[A-Za-z0-9_]+)\s*\(/g;
while ((m = reFunc.exec(html)) !== null) {
  if (!funcs.includes(m[1])) funcs.push(m[1]);
}
console.log('\n--- INTERACTION & MODAL FUNCTIONS IN V1 ---');
console.log(funcs);

// Find tables in V1
const tables = [];
let reTable = /<table[^>]*id="([^"]+)"/gi;
while ((m = reTable.exec(html)) !== null) {
  tables.push(m[1]);
}
console.log('\n--- TABLES WITH IDS IN V1 ---');
console.log(tables);

// Find all chart canvases
const canvases = [];
let reCanvas = /<canvas[^>]*id="([^"]+)"/gi;
while ((m = reCanvas.exec(html)) !== null) {
  canvases.push(m[1]);
}
console.log('\n--- CHART CANVASES IN V1 ---');
console.log(canvases);
