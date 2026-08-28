const xlsx = require('xlsx');
const fs = require('fs');

try {
    let filePath = fs.readFileSync('excel_path.txt', 'utf8').split('\n')[0].trim();
    const workbook = xlsx.readFile(filePath);
    console.log("Sheets:", workbook.SheetNames);
    
    if (workbook.SheetNames.includes("KPI Total")) {
        const sheet = workbook.Sheets["KPI Total"];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        console.log("\n--- KPI Total Data ---");
        for (let i = 0; i < Math.min(data.length, 60); i++) {
            console.log("Row " + i + ":", data[i]);
        }
    } else {
        console.log("No 'KPI Total' sheet found.");
    }
} catch (err) {
    console.error("Error reading excel:", err.message);
}
