import XLSX from 'xlsx';
import path from 'path';

const filePath = path.resolve('Za portal.xlsx');
const workbook = XLSX.readFile(filePath, { cellDates: true });

console.log("Sheet names in Za portal.xlsx:", workbook.SheetNames);

for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n--- Sheet: ${sheetName} ---`);
    console.log(`Total rows: ${data.length}`);
    if (data.length > 0) {
        console.log("Header row:", data[0]);
        if (data.length > 1) {
            console.log("First data row:", data[1]);
        }
    }
}
