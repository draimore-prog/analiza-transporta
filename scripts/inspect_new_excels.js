const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const dir = 'c:\\Users\\Bingo\\Desktop\\Analiza transporta';
const files = ['Ponjava.xlsx', 'Transportna 31.05.2026.g..xlsx'];

files.forEach(fileName => {
    const filePath = path.join(dir, fileName);
    console.log(`\n=================== FILE: ${fileName} ===================`);
    if (!fs.existsSync(filePath)) {
        console.log("File does not exist!");
        return;
    }

    const workbook = XLSX.readFile(filePath);
    console.log('Sheet Names:', workbook.SheetNames);

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`\n--- Sheet: ${sheetName} ---`);
        console.log(`Total Rows: ${rows.length}`);
        if (rows.length > 0) {
            console.log('Row 1 (Headers?):', rows[0]);
            if (rows.length > 1) console.log('Row 2:', rows[1]);
            if (rows.length > 2) console.log('Row 3:', rows[2]);
            if (rows.length > 3) console.log('Row 4:', rows[3]);
            if (rows.length > 4) console.log('Row 5:', rows[4]);
        }
    });
});
