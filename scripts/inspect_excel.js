const XLSX = require('xlsx');
const path = require('path');

const excelFilePath = path.join(__dirname, '..', 'Pregled troškova 26 10.07.2026.xlsx');
console.log('Reading file:', excelFilePath);

const workbook = XLSX.readFile(excelFilePath);
console.log('Sheet Names:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n--- Sheet: ${sheetName} ---`);
    console.log(`Total Rows: ${data.length}`);
    if (data.length > 0) {
        console.log('Header Row (Row 1):', data[0]);
        console.log('Sample Row 2:', data[1]);
        if (data.length > 2) console.log('Sample Row 3:', data[2]);
    }
});
