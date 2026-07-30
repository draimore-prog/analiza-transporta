const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const excelFilePath = path.join(__dirname, '..', 'Pregled troškova 26 10.07.2026.xlsx');
const outputJsonPath = path.join(__dirname, '..', 'fleet_data.json');

console.log('Loading workbook from:', excelFilePath);
const workbook = XLSX.readFile(excelFilePath);

let globalData = [];
let kpiTotalFleetByYear = {};
let kpiTotalCostsByYear = {};

// Helper cleaners
function ocistiSegment(seg) {
    if (!seg) return 'Ostalo';
    let s = seg.toString().trim();
    if (s.toLowerCase().includes('mehan')) return 'Mehanika';
    if (s.toLowerCase().includes('elekt')) return 'Elektronika';
    if (s.toLowerCase().includes('gume') || s.toLowerCase().includes('pneumat')) return 'Gume';
    if (s.toLowerCase().includes('karos') || s.toLowerCase().includes('limar')) return 'Karoserija';
    if (s.toLowerCase().includes('tečn') || s.toLowerCase().includes('tecn') || s.toLowerCase().includes('ulj')) return 'Tečnost';
    if (s.toLowerCase().includes('sign')) return 'Signalizacija';
    if (s.toLowerCase().includes('staklo') || s.toLowerCase().includes('šajb')) return 'Stakla';
    if (s.toLowerCase().includes('regist') || s.toLowerCase().includes('tehnički')) return 'Registracija';
    if (s.toLowerCase().includes('pranj') || s.toLowerCase().includes('čisć')) return 'Pranje';
    return s;
}

function ocistiTip(tip) {
    if (!tip) return 'Ostalo';
    let t = tip.toString().trim();
    if (t.toLowerCase().includes('teret')) return 'Teretno';
    if (t.toLowerCase().includes('putničk') || t.toLowerCase().includes('putnick')) return 'Putničko';
    if (t.toLowerCase().includes('priključ') || t.toLowerCase().includes('prikol')) return 'Priključno';
    if (t.toLowerCase().includes('skladiš') || t.toLowerCase().includes('viljuš') || t.toLowerCase().includes('skladis')) return 'Skladišna mehanizacija';
    return t;
}

function ocistiMarku(marka) {
    if (!marka) return 'Nepoznato';
    let m = marka.toString().trim();
    if (m === '' || m === '-') return 'Nepoznato';
    return m;
}

function parseExcelDate(val, year, month) {
    if (!val) return null;
    if (typeof val === 'number') {
        const d = XLSX.SSF.parse_date_code(val);
        if (d) return new Date(d.y, d.m - 1, d.d).toISOString();
    }
    if (typeof val === 'string') {
        const parts = val.split('.');
        if (parts.length >= 3) {
            const day = parseInt(parts[0]);
            const m = parseInt(parts[1]);
            const y = parseInt(parts[2]);
            if (!isNaN(day) && !isNaN(m) && !isNaN(y)) return new Date(y, m - 1, day).toISOString();
        }
    }
    if (year && month) {
        return new Date(year, month - 1, 15).toISOString();
    }
    return null;
}

// 1. KPI TOTAL SHEET
if (workbook.Sheets['KPI Total']) {
    try {
        const sheet = workbook.Sheets['KPI Total'];
        const jsonRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (jsonRows.length >= 2) {
            let header = jsonRows[0];
            let yearCols = {};
            header.forEach((val, colIdx) => {
                let y = parseInt(val);
                if (y >= 2021 && y <= 2030) yearCols[colIdx] = y;
            });

            for (let r = 2; r <= 8; r++) {
                let row = jsonRows[r];
                if (!row || row.length === 0) continue;
                let rawCatName = (row[0] || '').toString().trim();
                let catName = ocistiTip(rawCatName);
                if (rawCatName.toLowerCase().includes('total') || rawCatName.toLowerCase().includes('ukupno')) catName = 'Total';

                Object.keys(yearCols).forEach(cIdx => {
                    let y = yearCols[cIdx];
                    let countVal = parseInt(row[cIdx]) || 0;
                    if (!kpiTotalFleetByYear[y]) kpiTotalFleetByYear[y] = { Total: 0 };
                    kpiTotalFleetByYear[y][catName] = countVal;
                });
            }
        }
    } catch (e) {
        console.warn('KPI Total parse warning:', e.message);
    }
}

// 2. PARSE TRANSACTION SHEETS (FINALDATA 2021 - 2026)
workbook.SheetNames.forEach(sheetName => {
    let sLower = sheetName.toLowerCase();
    if (sLower.includes('šifrarnik') || sLower.includes('sifrarnik') || sLower.includes('kpi') || sLower.includes('pregled odr') || sLower.includes('sipanja')) return;

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const jsonData = XLSX.utils.sheet_to_json(sheet);
    if (!jsonData || !Array.isArray(jsonData)) return;

    jsonData.forEach(row => {
        if (!row || typeof row !== 'object') return;

        let regRaw = row['Reg.oznaka'] || row['RegBroj'] || row['Reg. Oznaka'] || row['REG'] || row['Registracija'];
        if (!regRaw) return;
        let reg = regRaw.toString().trim().toUpperCase();
        if (reg === '' || reg === 'NEPOZNATO' || reg === '-') return;

        let cost = parseFloat(row['cijTot']) || parseFloat(row['CijRezDio']) || parseFloat(row['Cijena']) || parseFloat(row['Trošak']) || 0;
        if (isNaN(cost) || cost <= 0) return;

        let costPart = parseFloat(row['CijRezDio']); if (isNaN(costPart)) costPart = 0;
        let costService = parseFloat(row['Cijusluge']); if (isNaN(costService)) costService = 0;

        if (costPart === 0 && costService === 0 && cost > 0) {
            let vrsta = (row['VrstaTroska'] || '').toString().toLowerCase();
            if (vrsta.includes('uslug') || vrsta.includes('rad')) costService = cost;
            else costPart = cost;
        }

        let year = parseInt(row['Year']) || parseInt(row['Godina']) || 0;
        let month = parseInt(row['Month']) || parseInt(row['Mjesec']) || 0;

        let segment = ocistiSegment(row['Segment'] || row['Kategorija']);
        let tipMehan = ocistiTip(row['TipMehan'] || row['Tip']);
        let markaVoz = ocistiMarku(row['MarkaVoz'] || row['Marka']);

        let dobavljacOrig = (row['dobavljac'] || row['Dobavljac'] || row['Serviser'] || row['Izvođač'] || '-').toString().trim();
        let isInternal = dobavljacOrig.toLowerCase().includes('intern');

        let rezDio = (row['RezDio'] || row['rezervni dio'] || '-').toString();
        let vrstaTroska = (row['VrstaTroska'] || row['Opis'] || '-').toString();
        let opisPopravke = rezDio !== '-' ? rezDio : vrstaTroska;

        let garazniBroj = (row['MT'] || row['GB'] || row['GarazniBroj'] || '-').toString().trim();
        let godProizvodnje = (row['God.'] || row['Godište'] || row['GodProizvodnje'] || '-').toString();

        let dateIso = parseExcelDate(row['Datum'] || row['Date'], year, month);
        if (!year && dateIso) year = new Date(dateIso).getFullYear();
        if (!month && dateIso) month = new Date(dateIso).getMonth() + 1;

        if (year >= 2000 && month >= 1 && month <= 12) {
            globalData.push({
                reg,
                cost: Math.round(cost * 100) / 100,
                costPart: Math.round(costPart * 100) / 100,
                costService: Math.round(costService * 100) / 100,
                year,
                month,
                segment,
                type: isInternal ? 'Interno' : 'Eksterno',
                dobavljacOrig,
                datum: dateIso,
                opisPopravke,
                tipMehan,
                markaVoz,
                garazniBroj,
                godProizvodnje
            });
        }
    });
});

console.log(`Parsed ${globalData.length} total maintenance records.`);
console.log('KPI Fleet Size by Year:', kpiTotalFleetByYear);

const outputData = {
    metadata: {
        exportedAt: new Date().toISOString(),
        totalRecords: globalData.length,
        fleetByYear: kpiTotalFleetByYear
    },
    records: globalData
};

fs.writeFileSync(outputJsonPath, JSON.stringify(outputData));
console.log('Saved extracted dataset to:', outputJsonPath);
