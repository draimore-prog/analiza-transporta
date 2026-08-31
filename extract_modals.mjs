import fs from 'fs';

const html = fs.readFileSync('public/v1.html', 'utf8');

function extractModal(id) {
  const start = html.indexOf(`id="${id}"`);
  if (start === -1) return null;
  // find preceding <div
  const divStart = html.lastIndexOf('<div', start);
  // find matching end
  return html.substring(divStart, divStart + 2500);
}

console.log('--- intExtRecapModal ---');
console.log(extractModal('intExtRecapModal'));

console.log('--- supplierDetailModal ---');
console.log(extractModal('supplierDetailModal'));

console.log('--- segmentDetailModal ---');
console.log(extractModal('segmentDetailModal'));
