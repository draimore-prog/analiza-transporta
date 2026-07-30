const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const dir = 'c:\\Users\\Bingo\\Desktop\\Analiza transporta';
const ponjavaPath = path.join(dir, 'Ponjava.xlsx');
const transportnaPath = path.join(dir, 'Transportna 31.05.2026.g..xlsx');
const troskoviPath = path.join(dir, 'Pregled troškova 26 10.07.2026.xlsx');

console.log("=== BUILDING PERFECT MASTER FLEET REGISTRY (ŠIFRARNIK VOZILA) ===");

const masterVehicles = new Map();

function cleanReg(str) {
    if (!str) return '';
    let s = str.toString().trim().toUpperCase();
    if (s === '-' || s === 'NEPOZNATO' || s === '/' || s === 'N/A' || s === '0' || s === 'NEPOZNATA' || /^\d+$/.test(s)) return '';
    return s;
}

function cleanString(str) {
    if (!str) return '-';
    let s = str.toString().trim();
    if (s === '/' || s === 'N/A' || s === '' || s === '0' || s.toLowerCase() === 'undefined') return '-';
    return s;
}

function cleanTip(tipStr, fallbackTip) {
    if (!tipStr) return fallbackTip || 'Ostalo';
    let t = tipStr.toString().trim().toLowerCase();
    if (t.includes('putni')) return 'Putničko';
    if (t.includes('teretn') || t.includes('kamion') || t.includes('tegljač') || t.includes('tegljac') || t.includes('kombi') || t.includes('caddy')) return 'Teretno';
    if (t.includes('prikoli') || t.includes('poluprikoli') || t.includes('priklju')) return 'Priključno';
    if (t.includes('skladis') || t.includes('skladiš') || t.includes('viljušk') || t.includes('viljusk') || t.includes('paletar') || t.includes('staker') || t.includes('regalni')) return 'Skladišna mehanizacija';
    if (t.includes('radna ma') || t.includes('radna') || t.includes('bager') || t.includes('traktor')) return 'Radna mašina';
    return fallbackTip || 'Ostalo';
}

function cleanMarkaModel(marka, model, defaultTip) {
    let m = cleanString(marka);
    let mod = cleanString(model);
    
    if (m === '-' && mod === '-') {
        return defaultTip === 'Skladišna mehanizacija' ? 'Linde' : 'Ostalo';
    }
    if (m === '-') return mod;
    if (mod === '-' || mod.toLowerCase() === m.toLowerCase()) return m;
    if (mod.toLowerCase().startsWith(m.toLowerCase())) return mod;
    return `${m} ${mod}`;
}

// 1. PROCESS PONJAVA.XLSX
if (fs.existsSync(ponjavaPath)) {
    console.log(`Processing Ponjava.xlsx sheets...`);
    const wb = XLSX.readFile(ponjavaPath);
    
    wb.SheetNames.forEach(sheetName => {
        const sheet = wb.Sheets[sheetName];
        if (!sheet) return;
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (!rows || rows.length < 2) return;

        let sheetLower = sheetName.toLowerCase();
        let isWarehouse = sheetLower.includes('skladišna') || sheetLower.includes('skladisna');
        let isTeretno = sheetLower.includes('teretna');
        let isPutnicko = sheetLower.includes('putnička') || sheetLower.includes('putnicka');
        let defaultTip = isWarehouse ? 'Skladišna mehanizacija' : (isTeretno ? 'Teretno' : (isPutnicko ? 'Putničko' : 'Ostalo'));

        let headerRow = rows[0].map(h => (h || '').toString().trim());

        // Find column indices
        let colReg = headerRow.findIndex(h => /reg/i.test(h) && !/dat/i.test(h) && !/istek/i.test(h));
        let colGb = headerRow.findIndex(h => /g\.broj|garažni|garazni|mt/i.test(h));
        let colMarka = headerRow.findIndex(h => /proizvođač|proizvođac|proiz\.|naziv sredstva|marka/i.test(h));
        let colModel = headerRow.findIndex(h => /model|tip/i.test(h));
        let colGod = headerRow.findIndex(h => /god/i.test(h));
        let colSasija = headerRow.findIndex(h => /šasij|sasij|seri/i.test(h));
        let colHours = headerRow.findIndex(h => /radni/i.test(h));

        for (let r = 1; r < rows.length; r++) {
            let row = rows[r];
            if (!row || row.length === 0) continue;

            let reg = colReg !== -1 ? cleanReg(row[colReg]) : '';
            let gb = colGb !== -1 ? cleanString(row[colGb]) : '-';
            let marka = colMarka !== -1 ? cleanString(row[colMarka]) : '-';
            let model = colModel !== -1 ? cleanString(row[colModel]) : '-';
            let god = colGod !== -1 ? cleanString(row[colGod]) : '-';
            let sasija = colSasija !== -1 ? cleanString(row[colSasija]) : '-';
            let radniSati = colHours !== -1 ? parseFloat(row[colHours]) || 0 : 0;

            if (isWarehouse && !reg) {
                reg = gb !== '-' ? `GB-${gb}` : '';
            }

            let vehicleKey = reg ? reg : (gb !== '-' ? `GB-${gb}` : (sasija !== '-' ? `VIN-${sasija}` : null));
            if (!vehicleKey) continue;

            let markaVoz = cleanMarkaModel(marka, model, defaultTip);

            let existing = masterVehicles.get(vehicleKey) || {
                reg: reg || (gb !== '-' ? `GB-${gb}` : vehicleKey),
                garazniBroj: gb,
                tipMehan: defaultTip,
                markaVoz: markaVoz,
                godProizvodnje: god,
                brojSasije: sasija,
                status: 'Aktivno',
                pocetnaKmRh: radniSati > 0 ? radniSati : 0,
                prodajnaKmRh: 0
            };

            if (gb !== '-' && existing.garazniBroj === '-') existing.garazniBroj = gb;
            if (sasija !== '-' && existing.brojSasije === '-') existing.brojSasije = sasija;
            if (god !== '-' && existing.godProizvodnje === '-') existing.godProizvodnje = god;
            if (radniSati > 0 && existing.pocetnaKmRh === 0) existing.pocetnaKmRh = radniSati;

            masterVehicles.set(vehicleKey, existing);
        }
    });
}

// 2. PROCESS TRANSPORTNA 31.05.2026.g..xlsx (Fixed asset ledger)
if (fs.existsSync(transportnaPath)) {
    console.log(`Processing Transportna 31.05.2026.g..xlsx...`);
    const wb = XLSX.readFile(transportnaPath);
    const sheet = wb.Sheets['1. dio'] || wb.Sheets[wb.SheetNames[0]];
    if (sheet) {
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        for (let r = 5; r < rows.length; r++) {
            let row = rows[r];
            if (!row || row.length < 3) continue;

            let invBroj = cleanString(row[1]);
            let naziv = cleanString(row[2]);

            let matchReg = naziv.match(/[A-Z0-9]{3}-[A-Z0-9]-[A-Z0-9]{3}|[A-Z0-9]{7}|[A-Z][0-9]{2}-[A-Z]-[0-9]{3}/i);
            if (matchReg) {
                let reg = matchReg[0].toUpperCase();
                let existing = masterVehicles.get(reg);
                if (existing) {
                    existing.invBroj = invBroj;
                }
            }
        }
    }
}

// 3. PROCESS PREGLED TROŠKOVA HISTORY DATASET
if (fs.existsSync(troskoviPath)) {
    console.log(`Processing Pregled troškova history dataset...`);
    const wb = XLSX.readFile(troskoviPath);
    wb.SheetNames.forEach(sheetName => {
        let sLower = sheetName.toLowerCase();
        if (sLower.includes('šifrarnik') || sLower.includes('sifrarnik') || sLower.includes('kpi')) return;
        const sheet = wb.Sheets[sheetName];
        if (!sheet) return;
        const rows = XLSX.utils.sheet_to_json(sheet);
        if (!rows || !Array.isArray(rows)) return;

        rows.forEach(row => {
            let regRaw = row['Reg.oznaka'] || row['RegBroj'] || row['Reg. Oznaka'] || row['REG'] || row['Registracija'];
            let reg = cleanReg(regRaw);
            if (!reg) return;

            let gb = cleanString(row['MT'] || row['GB'] || row['GarazniBroj']);
            let god = cleanString(row['God.'] || row['Godište'] || row['GodProizvodnje']);
            let tip = cleanTip(row['TipMehan'] || row['Tip']);
            let marka = cleanMarkaModel(row['MarkaVoz'] || row['Marka'], '-', tip);

            if (!masterVehicles.has(reg)) {
                masterVehicles.set(reg, {
                    reg: reg,
                    garazniBroj: gb,
                    tipMehan: tip,
                    markaVoz: marka,
                    godProizvodnje: god,
                    brojSasije: '-',
                    status: 'Aktivno',
                    pocetnaKmRh: 0,
                    prodajnaKmRh: 0
                });
            } else {
                let v = masterVehicles.get(reg);
                if (gb !== '-' && v.garazniBroj === '-') v.garazniBroj = gb;
                if (god !== '-' && v.godProizvodnje === '-') v.godProizvodnje = god;
            }
        });
    });
}

// Format final master array sorted by Registration Plate
let masterArray = Array.from(masterVehicles.values());
masterArray.sort((a, b) => a.reg.localeCompare(b.reg));

let finalMasterList = masterArray.map((veh, idx) => ({
    rb: idx + 1,
    reg: veh.reg,
    garazniBroj: veh.garazniBroj,
    tipMehan: veh.tipMehan,
    markaVoz: veh.markaVoz,
    godProizvodnje: veh.godProizvodnje,
    brojSasije: veh.brojSasije,
    status: veh.status || 'Aktivno',
    pocetnaKmRh: veh.pocetnaKmRh || 0,
    prodajnaKmRh: veh.prodajnaKmRh || 0
}));

console.log(`\n=================== RESULT SUMMARY ===================`);
console.log(`Total Clean Master Fleet Vehicles: ${finalMasterList.length}`);

console.log("\nSample 10 Clean Master Records:");
console.log(finalMasterList.slice(0, 10));

const outputPath = path.join(dir, 'fleet_master.json');
fs.writeFileSync(outputPath, JSON.stringify(finalMasterList, null, 2));
console.log(`\nSaved Master Fleet Registry to: ${outputPath}`);
