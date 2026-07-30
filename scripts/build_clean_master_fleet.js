const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const dir = 'c:\\Users\\Bingo\\Desktop\\Analiza transporta';
const ponjavaPath = path.join(dir, 'Ponjava.xlsx');
const transportnaPath = path.join(dir, 'Transportna 31.05.2026.g..xlsx');
const troskoviPath = path.join(dir, 'Pregled troškova 26 10.07.2026.xlsx');

console.log("=== BUILDING ULTRA-CLEAN & DEDUPLICATED MASTER FLEET REGISTRY (V2) ===");

const masterMap = new Map();

// Standardized Brands
const BRANDS_DEF = [
    { name: 'Jungheinrich', patterns: ['jungheinrich', 'jungeihrich', 'jungheinric'] },
    { name: 'Linde', patterns: ['linde'] },
    { name: 'Mercedes Benz', patterns: ['mercedes', 'mercedes-benz', 'mercedes benz'] },
    { name: 'Volkswagen', patterns: ['volkswagen', 'vw'] },
    { name: 'Škoda', patterns: ['škoda', 'skoda'] },
    { name: 'Audi', patterns: ['audi'] },
    { name: 'BMW', patterns: ['bmw'] },
    { name: 'MAN', patterns: ['man'] },
    { name: 'Volvo', patterns: ['volvo'] },
    { name: 'Iveco', patterns: ['iveco'] },
    { name: 'Peugeot', patterns: ['peugeot', 'peugot'] },
    { name: 'Ford', patterns: ['ford'] },
    { name: 'Renault', patterns: ['renault'] },
    { name: 'Fiat', patterns: ['fiat'] },
    { name: 'Still', patterns: ['still'] },
    { name: 'Toyota', patterns: ['toyota'] },
    { name: 'Caterpillar', patterns: ['caterpillar', 'cat'] },
    { name: 'Komatsu', patterns: ['komatsu'] },
    { name: 'Nissan', patterns: ['nissan'] },
    { name: 'Suzuki', patterns: ['suzuki'] },
    { name: 'Seat', patterns: ['seat'] },
    { name: 'Hyundai', patterns: ['hyundai'] },
    { name: 'Kia', patterns: ['kia'] },
    { name: 'Daf', patterns: ['daf'] },
    { name: 'Scania', patterns: ['scania'] },
    { name: 'Mitsubishi', patterns: ['mitsubishi'] },
    { name: 'JCB', patterns: ['jcb'] }
];

function cleanReg(str) {
    if (!str) return '';
    let s = str.toString().trim().toUpperCase();
    if (s === '-' || s === 'NEPOZNATO' || s === '/' || s === 'N/A' || s === '0' || s === 'NEPOZNATA') return '';
    return s;
}

function cleanString(str) {
    if (!str) return '-';
    let s = str.toString().trim();
    if (s === '/' || s === 'N/A' || s === '' || s === '0' || s.toLowerCase() === 'undefined' || s === '-') return '-';
    return s;
}

function normalizeKey(reg, gb, sasija, tip) {
    let r = cleanReg(reg);
    if (r) {
        let norm = r.replace(/[\s\.-]/g, '');
        if (norm) return norm;
    }
    let g = cleanString(gb);
    if (g !== '-') {
        let normG = g.replace(/[\s\.-]/g, '');
        if (normG) return `GB_${normG}`;
    }
    let s = cleanString(sasija);
    if (s !== '-') {
        let normS = s.replace(/[\s\.-]/g, '');
        if (normS) return `VIN_${normS}`;
    }
    return null;
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

function parseBrandAndModel(rawMarka, rawModel, tipMehan) {
    let mStr = cleanString(rawMarka);
    let modStr = cleanString(rawModel);
    let combined = `${mStr !== '-' ? mStr : ''} ${modStr !== '-' ? modStr : ''}`.trim();
    let combinedLower = combined.toLowerCase();

    // 1. Identify Brand
    let brand = null;
    for (let b of BRANDS_DEF) {
        if (b.patterns.some(p => combinedLower.includes(p))) {
            brand = b.name;
            break;
        }
    }
    if (!brand) {
        if (tipMehan === 'Skladišna mehanizacija') brand = 'Linde';
        else if (mStr !== '-') brand = mStr.split(' ')[0];
        else brand = 'Ostalo';
    }

    // 2. Identify Model
    let cleanMod = combined;

    // Remove brand keywords from model string
    BRANDS_DEF.forEach(b => {
        b.patterns.forEach(p => {
            let reExp = new RegExp('\\b' + p + '\\b', 'gi');
            cleanMod = cleanMod.replace(reExp, '');
        });
    });

    // Strip noise text (cities, "viljuskar", "nafta", "plin", etc.)
    cleanMod = cleanMod.replace(/vilj\w*|viljuškar|viljuskar|pogon|nafta|plin|dizel|struja|električni|prebačen|lokacija|direkcija|regionalni|menadžer|maloprodaja|održavanje|srebrenik|tuzla|trebinje|visoko|sarajevo|dubica|mostar|bihać|bihac|zenica|prijedor|brčko|brcko|kiseljak|bjeljina|bijeljina|tuš|zivinice|živinice|bos\.|poljana|plastenici|ciljuge|đoli|dita|krajina|hercegovina/gi, '');
    cleanMod = cleanMod.replace(/[\/\\,\(\)]/g, ' ').replace(/\s+/g, ' ').trim();

    if (!cleanMod || cleanMod === '-' || cleanMod.length < 2) {
        cleanMod = (modStr !== '-' && modStr !== mStr) ? modStr : brand;
    }

    return { marka: brand, model: cleanMod };
}

// 1. PROCESS PONJAVA.XLSX (Primary source of fleet procurement)
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
            let markaRaw = colMarka !== -1 ? cleanString(row[colMarka]) : '-';
            let modelRaw = colModel !== -1 ? cleanString(row[colModel]) : '-';
            let god = colGod !== -1 ? cleanString(row[colGod]) : '-';
            let sasija = colSasija !== -1 ? cleanString(row[colSasija]) : '-';
            let radniSati = colHours !== -1 ? parseFloat(row[colHours]) || 0 : 0;

            if (isWarehouse && !reg && gb !== '-') {
                reg = `GB-${gb}`;
            }

            let key = normalizeKey(reg, gb, sasija, defaultTip);
            if (!key) continue;

            let parsedBM = parseBrandAndModel(markaRaw, modelRaw, defaultTip);

            let existing = masterMap.get(key) || {
                reg: reg || (gb !== '-' ? `GB-${gb}` : key),
                garazniBroj: gb,
                tipMehan: defaultTip,
                markaVoz: parsedBM.marka,
                modelVoz: parsedBM.model,
                godProizvodnje: god,
                brojSasije: sasija,
                status: 'Aktivno',
                pocetnaKmRh: radniSati > 0 ? radniSati : 0,
                prodajnaKmRh: 0
            };

            // Ponjava has primary authoritative models
            if (modelRaw !== '-' && modelRaw !== markaRaw) {
                let cleanPMod = parseBrandAndModel('-', modelRaw, defaultTip).model;
                if (cleanPMod && cleanPMod !== '-') existing.modelVoz = cleanPMod;
            }

            if (gb !== '-' && existing.garazniBroj === '-') existing.garazniBroj = gb;
            if (sasija !== '-' && existing.brojSasije === '-') existing.brojSasije = sasija;
            if (god !== '-' && existing.godProizvodnje === '-') existing.godProizvodnje = god;
            if (radniSati > 0 && existing.pocetnaKmRh === 0) existing.pocetnaKmRh = radniSati;
            if (parsedBM.marka !== 'Ostalo') existing.markaVoz = parsedBM.marka;

            masterMap.set(key, existing);
        }
    });
}

// 2. PROCESS PREGLED TROŠKOVA HISTORY DATASET
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
            let gb = cleanString(row['MT'] || row['GB'] || row['GarazniBroj']);
            let tip = cleanTip(row['TipMehan'] || row['Tip']);
            
            let key = normalizeKey(reg, gb, null, tip);
            if (!key) return;

            let god = cleanString(row['God.'] || row['Godište'] || row['GodProizvodnje']);
            let markaRaw = cleanString(row['MarkaVoz'] || row['Marka']);
            let parsedBM = parseBrandAndModel(markaRaw, '-', tip);

            if (!masterMap.has(key)) {
                masterMap.set(key, {
                    reg: reg || (gb !== '-' ? `GB-${gb}` : key),
                    garazniBroj: gb,
                    tipMehan: tip,
                    markaVoz: parsedBM.marka,
                    modelVoz: parsedBM.model,
                    godProizvodnje: god,
                    brojSasije: '-',
                    status: 'Aktivno',
                    pocetnaKmRh: 0,
                    prodajnaKmRh: 0
                });
            } else {
                let v = masterMap.get(key);
                if (gb !== '-' && v.garazniBroj === '-') v.garazniBroj = gb;
                if (god !== '-' && v.godProizvodnje === '-') v.godProizvodnje = god;
                if (parsedBM.marka !== 'Ostalo' && v.markaVoz === 'Ostalo') v.markaVoz = parsedBM.marka;
            }
        });
    });
}

// Format final list sorted by Registration Plate / Garage Number
let masterArray = Array.from(masterMap.values());
masterArray.sort((a, b) => a.reg.localeCompare(b.reg));

let finalMasterList = masterArray.map((veh, idx) => ({
    rb: idx + 1,
    reg: veh.reg,
    garazniBroj: veh.garazniBroj,
    tipMehan: veh.tipMehan,
    markaVoz: veh.markaVoz,
    modelVoz: veh.modelVoz || veh.markaVoz,
    godProizvodnje: veh.godProizvodnje,
    brojSasije: veh.brojSasije,
    status: veh.status || 'Aktivno',
    pocetnaKmRh: veh.pocetnaKmRh || 0,
    prodajnaKmRh: veh.prodajnaKmRh || 0
}));

console.log(`\n=================== CLEANING RESULT (V2) ===================`);
console.log(`Total Deduplicated Clean Vehicles in Master Codebook: ${finalMasterList.length}`);

console.log("\nSample 15 Clean Master Records (Marka | Model | Reg):");
finalMasterList.slice(0, 15).forEach(v => {
    console.log(`[${v.rb}] Reg: ${v.reg.padEnd(10)} | Marka: ${v.markaVoz.padEnd(15)} | Model: ${v.modelVoz.padEnd(20)} | VIN: ${v.brojSasije}`);
});

const outputPath = path.join(dir, 'fleet_master.json');
fs.writeFileSync(outputPath, JSON.stringify(finalMasterList, null, 2));
console.log(`\nSaved Clean Master Fleet Registry to: ${outputPath}`);
