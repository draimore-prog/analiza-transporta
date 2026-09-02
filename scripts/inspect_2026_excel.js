import XLSX from 'xlsx';
import path from 'path';

const filePath = path.resolve('Za portal.xlsx');
const workbook = XLSX.readFile(filePath, { cellDates: true });
const sheet = workbook.Sheets['FINALDATA 2026'];
const rows = XLSX.utils.sheet_to_json(sheet);

console.log(`Total rows in FINALDATA 2026: ${rows.length}`);

const monthCounts = {};
const monthSums = {};

rows.forEach((r, idx) => {
    let m = r['Month'];
    let yr = r['Year'];
    let tot = parseFloat(r['cijTot']) || 0;
    
    monthCounts[m] = (monthCounts[m] || 0) + 1;
    monthSums[m] = (monthSums[m] || 0) + tot;
});

console.log("\nBreakdown by Month in Excel FINALDATA 2026:");
for (let m = 1; m <= 12; m++) {
    if (monthCounts[m] !== undefined) {
        console.log(`Month ${m}: ${monthCounts[m]} rows | Total Cost: ${monthSums[m].toFixed(2)} KM`);
    }
}

// Check other months if any undefined
if (monthCounts[undefined]) {
    console.log(`Undefined month: ${monthCounts[undefined]} rows`);
}
